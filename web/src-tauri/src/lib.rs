use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_log::Builder::default().build())
    .setup(|app| {
      // Spawn the backend sidecar
      // The sidecar name must match the name in tauri.conf.json
      let sidecar_command = app.shell().sidecar("backend-engine").expect("Failed to create sidecar command");
      let (mut rx, mut child) = sidecar_command
        .spawn()
        .expect("Failed to spawn sidecar");

      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
            println!("[SIDECAR STDOUT] {}", String::from_utf8_lossy(&line));
          } else if let tauri_plugin_shell::process::CommandEvent::Stderr(line) = event {
            eprintln!("[SIDECAR STDERR] {}", String::from_utf8_lossy(&line));
          }
        }
      });
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
