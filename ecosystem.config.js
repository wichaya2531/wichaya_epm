module.exports = {
  apps: [
    {
      name: "epm",
      cwd: "C:/Users/1000222790/Documents/GitHub/e_pm",
      script: "node_modules/next/dist/bin/next", // เรียก next ตรงๆ ไม่ผ่าน npm.cmd
      args: "start -p 3000",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", HOSTNAME: "0.0.0.0" },
      max_memory_restart: "1024M",
      windowsHide: false
    }
  ]
};
