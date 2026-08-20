using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Wadi Degla Attendance and Overtime Tracker")]
[assembly: System.Reflection.AssemblyProduct("Wadi Degla Attendance Tracker")]
[assembly: System.Reflection.AssemblyCompany("Wadi Degla Clubs")]
[assembly: System.Reflection.AssemblyVersion("2.0.0.0")]

namespace WadiDegla
{
    class ResourceInfo
    {
        public string Name;
        public string Mime;
        public ResourceInfo(string n, string m) { Name = n; Mime = m; }
    }

    static class Program
    {
        static HttpListener _listener;
        static Dictionary<string, byte[]> _cache = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);

        // Maps URL paths to (embedded resource name, MIME type)
        static readonly Dictionary<string, ResourceInfo> _routes = new Dictionary<string, ResourceInfo>(StringComparer.OrdinalIgnoreCase)
        {
            { "/",                                                    new ResourceInfo("app_html",    "text/html; charset=utf-8") },
            { "/index.html",                                          new ResourceInfo("app_html",    "text/html; charset=utf-8") },
            { "/app.html",                                            new ResourceInfo("app_html",    "text/html; charset=utf-8") },
            { "/assets/index-DhCM9XKE.js",                           new ResourceInfo("assets_js",   "application/javascript; charset=utf-8") },
            { "/assets/index-BV141Grc.css",                          new ResourceInfo("assets_css",  "text/css; charset=utf-8") },
            { "/assets/wadi_degla_official_logo_1787130969864-CiiH7bj8.jpg", new ResourceInfo("assets_logo", "image/jpeg") },
        };

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Pre-load all resources into cache
            Assembly asm = Assembly.GetExecutingAssembly();
            foreach (var kv in _routes)
            {
                string resName = kv.Value.Name;
                if (_cache.ContainsKey(resName)) continue;
                using (Stream s = asm.GetManifestResourceStream(resName))
                {
                    if (s == null) continue;
                    byte[] buf = new byte[s.Length];
                    int offset = 0, read;
                    while ((read = s.Read(buf, offset, buf.Length - offset)) > 0) offset += read;
                    _cache[resName] = buf;
                }
            }

            // Find a free port
            int port = FindFreePort(3000);
            string localUrl   = "http://localhost:" + port + "/";
            string networkIp  = GetPrimaryNetworkIp();
            string networkUrl = string.IsNullOrEmpty(networkIp) ? "" : "http://" + networkIp + ":" + port + "/";

            // Start the built-in HTTP server on a background thread
            Thread serverThread = new Thread(() => RunServer(port));
            serverThread.IsBackground = true;
            serverThread.Start();
            Thread.Sleep(600); // give the listener time to bind

            // Open browser in app mode
            OpenUrl(localUrl);

            // Build the system tray icon
            NotifyIcon tray = new NotifyIcon();
            tray.Text = "Wadi Degla - Attendance Tracker";
            tray.Icon = System.Drawing.SystemIcons.Application;
            tray.Visible = true;

            // Context menu
            ContextMenu menu = new ContextMenu();
            MenuItem miOpen = new MenuItem("Open Application");
            miOpen.DefaultItem = true;
            miOpen.Click += (s, e) => OpenUrl(localUrl);
            menu.MenuItems.Add(miOpen);

            if (!string.IsNullOrEmpty(networkUrl))
            {
                MenuItem miNet = new MenuItem("Network URL: " + networkUrl);
                miNet.Click += (s, e) => {
                    Clipboard.SetText(networkUrl);
                    tray.ShowBalloonTip(3000, "Copied!", "Network URL copied to clipboard:\n" + networkUrl, ToolTipIcon.Info);
                };
                menu.MenuItems.Add(miNet);
            }

            menu.MenuItems.Add("-");
            MenuItem miExit = new MenuItem("Exit");
            miExit.Click += (s, e) => Application.Exit();
            menu.MenuItems.Add(miExit);

            tray.ContextMenu = menu;
            tray.DoubleClick += (s, e) => OpenUrl(localUrl);

            // Balloon tip on startup
            tray.ShowBalloonTip(4000,
                "Wadi Degla Tracker is Running",
                "Local: " + localUrl + (string.IsNullOrEmpty(networkUrl) ? "" : "\nNetwork: " + networkUrl),
                ToolTipIcon.Info);

            // Run the Windows message loop (keeps the app alive)
            Application.Run();

            // Cleanup on exit
            tray.Visible = false;
            if (_listener != null && _listener.IsListening) { try { _listener.Stop(); } catch {} }
        }

        static void RunServer(int port)
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://+:" + port + "/");
            try
            {
                _listener.Start();
            }
            catch
            {
                // Fallback: bind only localhost if + prefix fails
                _listener = new HttpListener();
                _listener.Prefixes.Add("http://localhost:" + port + "/");
                _listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
                _listener.Start();
            }

            while (_listener.IsListening)
            {
                HttpListenerContext ctx = null;
                try { ctx = _listener.GetContext(); } catch { break; }
                if (ctx == null) break;

                ThreadPool.QueueUserWorkItem(state => HandleRequest((HttpListenerContext)state), ctx);
            }
        }

        static void HandleRequest(HttpListenerContext ctx)
        {
            HttpListenerRequest  req = ctx.Request;
            HttpListenerResponse res = ctx.Response;

            string rawUrl = req.Url.AbsolutePath;
            if (string.IsNullOrEmpty(rawUrl)) rawUrl = "/";

            // Decode URL
            try { rawUrl = Uri.UnescapeDataString(rawUrl); } catch {}

            res.AddHeader("Access-Control-Allow-Origin", "*");
            res.AddHeader("Cache-Control", "public, max-age=86400");

            ResourceInfo info;
            if (_routes.TryGetValue(rawUrl, out info) && _cache.ContainsKey(info.Name))
            {
                byte[] data = _cache[info.Name];
                res.StatusCode = 200;
                res.ContentType = info.Mime;
                res.ContentLength64 = data.Length;
                try { res.OutputStream.Write(data, 0, data.Length); } catch {}
            }
            else
            {
                // Unknown route — serve app.html (SPA fallback)
                if (_cache.ContainsKey("app_html"))
                {
                    byte[] data = _cache["app_html"];
                    res.StatusCode = 200;
                    res.ContentType = "text/html; charset=utf-8";
                    res.ContentLength64 = data.Length;
                    try { res.OutputStream.Write(data, 0, data.Length); } catch {}
                }
                else
                {
                    res.StatusCode = 404;
                    byte[] not = Encoding.UTF8.GetBytes("404 Not Found");
                    res.ContentLength64 = not.Length;
                    try { res.OutputStream.Write(not, 0, not.Length); } catch {}
                }
            }

            try { res.Close(); } catch {}
        }

        static int FindFreePort(int preferred)
        {
            for (int p = preferred; p < preferred + 20; p++)
            {
                try
                {
                    var l = new TcpListener(IPAddress.Loopback, p);
                    l.Start();
                    l.Stop();
                    return p;
                }
                catch { }
            }
            return preferred;
        }

        static string GetPrimaryNetworkIp()
        {
            try
            {
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus != OperationalStatus.Up) continue;
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                    foreach (UnicastIPAddressInformation addr in ni.GetIPProperties().UnicastAddresses)
                    {
                        if (addr.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                        {
                            string ip = addr.Address.ToString();
                            if (!ip.StartsWith("169.254")) return ip;
                        }
                    }
                }
            }
            catch {}
            return "";
        }

        static void OpenUrl(string url)
        {
            string[] edgePaths = {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            };
            foreach (string ep in edgePaths)
            {
                if (File.Exists(ep))
                {
                    Process.Start(ep, "--app=" + url + " --window-size=1350,900");
                    return;
                }
            }
            string[] chromePaths = {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
            };
            foreach (string cp in chromePaths)
            {
                if (File.Exists(cp))
                {
                    Process.Start(cp, "--app=" + url + " --window-size=1350,900");
                    return;
                }
            }
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
    }
}
