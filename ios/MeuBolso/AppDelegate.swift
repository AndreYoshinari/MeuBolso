import UIKit
internal import Expo

@main
class AppDelegate: ExpoAppDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    excludeLedgerFromBackup()
    NotificationCenter.default.addObserver(
      forName: UIApplication.didEnterBackgroundNotification,
      object: nil,
      queue: .main
    ) { _ in
      excludeLedgerFromBackup()
    }
    true
  }
}

private let ledgerFileNames = ["meubolso.db", "meubolso.db-wal", "meubolso.db-shm"]

private func excludeLedgerFromBackup() {
  let fileManager = FileManager.default

  guard
    let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first
  else {
    return
  }

  let directory = documents.appendingPathComponent("SQLite", isDirectory: true)

  if !fileManager.fileExists(atPath: directory.path) {
    try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  markExcludedFromBackup(directory)

  for name in ledgerFileNames {
    let file = directory.appendingPathComponent(name)

    if fileManager.fileExists(atPath: file.path) {
      markExcludedFromBackup(file)
    }
  }
}

private func markExcludedFromBackup(_ url: URL) {
  var item = url
  var values = URLResourceValues()
  values.isExcludedFromBackup = true
  try? item.setResourceValues(values)
}
