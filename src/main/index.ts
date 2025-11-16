import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { initStorage } from './database/storage';
import { setupPdfHandler } from './pdfHandler';

// Declare webpack entry points
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Disable hardware acceleration to avoid GPU crashes on some systems
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#FFFFFF',
    show: false, // Don't show until ready
  });

  // Load the index.html of the app.
  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  try {
    initStorage();
    console.log('✅ Storage initialized');

    registerIPCHandlers();
    setupPdfHandler();
    console.log('✅ IPC handlers registered');

    createWindow();
    console.log('✅ Window created');
  } catch (error) {
    console.error('❌ Startup error:', error);
    app.quit();
  }
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Register IPC handlers
function registerIPCHandlers() {
  // Import IPC handlers
  require('./ipc/projects');
  require('./ipc/tasks');
  require('./ipc/milestones');
  require('./ipc/resources');
  require('./ipc/taskAssignments');
  require('./ipc/comments');
  require('./ipc/attachments');
  require('./ipc/files');
  require('./ipc/activityLog');

  // Test handler
  ipcMain.handle('ping', async () => {
    console.log('Received ping');
    return 'pong';
  });

  // Open external URL handler
  ipcMain.handle('open-external', async (_event, url: string) => {
    console.log('Received request to open external URL:', url);
    try {
      await shell.openExternal(url);
      console.log('Successfully opened URL:', url);
    } catch (error) {
      console.error('Error opening external URL:', error);
      throw error;
    }
  });
}

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
