using System;
using System.Data.SQLite;
using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using System.Timers;
using Microsoft.Data.Sqlite;

namespace vs
{
    public class Worker : BackgroundService
    {
        private const int WH_CBT = 5;
        private const int HCBT_ACTIVATE = 5;
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        private System.Timers.Timer _timer;
        private const int InactivityThreshold = 5;  // Inactivity threshold in minutes
        private ManagementEventWatcher _startWatch;
        private ManagementEventWatcher _stopWatch;
        private static DateTime lastActivity = DateTime.Now;
        private static readonly object _lock = new object();

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT
        {
            public uint vkCode;
            public uint scanCode;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct LASTINPUTINFO
        {
            public uint cbSize;
            public uint dwTime;
        }

        [DllImport("user32.dll")]
        static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private void CheckInactivity(object sender, ElapsedEventArgs e)
        {
            LASTINPUTINFO lastInputInfo = new LASTINPUTINFO();
            lastInputInfo.cbSize = (uint)Marshal.SizeOf(lastInputInfo);
            GetLastInputInfo(ref lastInputInfo);

            uint idleTime = ((uint)Environment.TickCount - lastInputInfo.dwTime) / 1000;

            if (idleTime > InactivityThreshold * 60)  // If computer has been inactive for more than the threshold
            {
                InsertEventToDatabase(DateTime.Now.Ticks, 0, "", 0, "", "Computer_Inactive");
            }
        }

        private void startWatch_EventArrived(object sender, EventArrivedEventArgs e)
        {
            string appName = e.NewEvent.Properties["ProcessName"].Value.ToString();
            int pid = Convert.ToInt32(e.NewEvent.Properties["ProcessID"].Value);
            InsertEventToDatabase(DateTime.Now.Ticks, pid, appName, 0, "", "Application_Open");
        }

        private void stopWatch_EventArrived(object sender, EventArrivedEventArgs e)
        {
            string appName = e.NewEvent.Properties["ProcessName"].Value.ToString();
            int pid = Convert.ToInt32(e.NewEvent.Properties["ProcessID"].Value);
            InsertEventToDatabase(DateTime.Now.Ticks, pid, appName, 0, "", "Application_Close");
        }

        private static void EnsureTableExists()
        {
            using (SqliteConnection connection = new SqliteConnection("Data Source=EventLog.sqlite"))
            {
                connection.Open();

                string commandText = @"
        CREATE TABLE IF NOT EXISTS EventLog (
            Timestamp INTEGER,
            Window_Id INTEGER,
            Application_Name TEXT,
            Desktop_Id INTEGER,
            Document_Opened TEXT,
            Event_Name TEXT
        )";
                using (SqliteCommand command = new SqliteCommand(commandText, connection))
                {
                    command.ExecuteNonQuery();
                }

                connection.Close();
            }
        }

        /*private static void EnsureTableExists()
        {
            using (SQLiteConnection connection = new SQLiteConnection("Data Source=EventLog.sqlite"))
            {
                connection.Open();

                using (SQLiteCommand command = new SQLiteCommand(connection))
                {
                    command.CommandText = @"
                CREATE TABLE IF NOT EXISTS EventLog (
                    Timestamp INTEGER,
                    Window_Id INTEGER,
                    Application_Name TEXT,
                    Desktop_Id INTEGER,
                    Document_Opened TEXT,
                    Event_Name TEXT
                )";
                    command.ExecuteNonQuery();
                }

                connection.Close();
            }
        }*/

        private static void InsertEventToDatabase(long timestamp, int windowId, string appName, int desktopId, string documentOpened, string eventName)
        {
            using (SqliteConnection connection = new SqliteConnection("Data Source=EventLog.sqlite"))
            {
                connection.Open();

                string commandText = @"
            INSERT INTO EventLog (Timestamp, Window_Id, Application_Name, Desktop_Id, Document_Opened, Event_Name)
            VALUES (@timestamp, @windowId, @appName, @desktopId, @documentOpened, @eventName)";

                using (SqliteCommand command = new SqliteCommand(commandText, connection))
                {
                    command.Parameters.AddWithValue("@timestamp", timestamp);
                    command.Parameters.AddWithValue("@windowId", windowId);
                    command.Parameters.AddWithValue("@appName", appName);
                    command.Parameters.AddWithValue("@desktopId", desktopId);
                    command.Parameters.AddWithValue("@documentOpened", documentOpened);
                    command.Parameters.AddWithValue("@eventName", eventName);

                    command.ExecuteNonQuery();
                }

                connection.Close();
            }
        }

        /*private static void InsertEventToDatabase(long timestamp, int windowId, string appName, int desktopId, string documentOpened, string eventName)
        {
            lock (_lock)
            {
                string filePath = "EventLog.csv";
                bool exists = File.Exists(filePath);

                using (StreamWriter writer = new StreamWriter(filePath, append: true))
                {
                    if (!exists)
                    {
                        // The file does not exist, write the headers
                        writer.WriteLine("Timestamp,Window_Id,Application_Name,Desktop_Id,Document_Opened,Event_Name");
                    }

                    // Write the data
                    writer.WriteLine($"{timestamp},{windowId},{appName},{desktopId},{documentOpened},{eventName}");
                }
            }
        }*/

        /*private static void InsertEventToDatabase(long timestamp, int windowId, string appName, int desktopId, string documentOpened, string eventName)
        {
            using (SQLiteConnection connection = new SQLiteConnection("Data Source=EventLog.sqlite"))
            {
                connection.Open();

                using (SQLiteCommand command = new SQLiteCommand(connection))
                {
                    command.CommandText = @"
                        INSERT INTO EventLog (Timestamp, Window_Id, Application_Name, Desktop_Id, Document_Opened, Event_Name)
                        VALUES (@timestamp, @windowId, @appName, @desktopId, @documentOpened, @eventName)";

                    command.Parameters.AddWithValue("@timestamp", timestamp);
                    command.Parameters.AddWithValue("@windowId", windowId);
                    command.Parameters.AddWithValue("@appName", appName);
                    command.Parameters.AddWithValue("@desktopId", desktopId);
                    command.Parameters.AddWithValue("@documentOpened", documentOpened);
                    command.Parameters.AddWithValue("@eventName", eventName);

                    command.ExecuteNonQuery();
                }

                connection.Close();
            }
        }*/


        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            EnsureTableExists();
            _hookID = SetHook(_proc);
            _timer = new System.Timers.Timer(60000);  // Check for inactivity every minute
            _timer.Elapsed += CheckInactivity;
            _timer.Start();

            _startWatch = new ManagementEventWatcher(
                new WqlEventQuery("SELECT * FROM Win32_ProcessStartTrace"));
            _startWatch.EventArrived
                        += new EventArrivedEventHandler(startWatch_EventArrived);
            _startWatch.Start();

            _stopWatch = new ManagementEventWatcher(
                new WqlEventQuery("SELECT * FROM Win32_ProcessStopTrace"));
            _stopWatch.EventArrived
                        += new EventArrivedEventHandler(stopWatch_EventArrived);
            _stopWatch.Start();

            while (!stoppingToken.IsCancellationRequested)
            {
                // Worker logic here
                await Task.Delay(1000, stoppingToken);
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            UnhookWindowsHookEx(_hookID);
            _timer.Stop();
            _timer.Elapsed -= CheckInactivity;
            _startWatch.Stop();
            _stopWatch.Stop();

            await base.StopAsync(stoppingToken);
        }

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                // WH_CBT
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }


        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode == HCBT_ACTIVATE)
            {
                long timestamp = DateTime.Now.Ticks;
                int windowId = wParam.ToInt32();
                string appName = "Unknown";  // You may use GetWindowText API to retrieve window title, but it does not give you the application name
                int desktopId = 0;  // Desktop ID is not straightforward to get and will require additional code and APIs
                string documentOpened = "Unknown";  // Document opened is application specific and is not straightforward to get
                string eventName = "Focus";

                InsertEventToDatabase(timestamp, windowId, appName, desktopId, documentOpened, eventName);
            }

            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
            {
                lastActivity = DateTime.Now;
            }

            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}

/* namespace vs;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            await Task.Delay(1000, stoppingToken);
        }
    }
}
*/