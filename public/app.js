/**
 *
 * MODULES
 *
 */

const url = require('url')
const path = require('path')

const {
  BrowserWindow,
  dialog,
  Menu,
  Notification,
  Tray,
  app,
  ipcMain,
  shell,
  globalShortcut
} = require('electron')
const Positioner = require('electron-positioner')
const isDev = require('electron-is-dev')
const AutoLaunch = require('auto-launch')
const log = require('electron-log')

const { config, data, updateData } = require('./store')
const icons = require('./icons')

let tray
let trayWindow
let positioner
const autoLauncher = new AutoLaunch({ name: 'tempus' })


app.setAppUserModelId('com.electron.tempus')

/* Create the application */
app.on('ready', () => {
  createTray()
  createWindow()
  checkForUpdates()
  registerGlobalShortcuts()
})

/* Change icon on idle */

ipcMain.on('idle', () => {
  tray.setImage(icons.idle)
})

/* Change icon on counting + notification */

ipcMain.on('counting', (event, displayWorkNotification) => {
  tray.setImage(icons.counting)
  if (config.get('autoHide')) {
    trayWindow.hide()
  }

  if (displayWorkNotification) {
    showNotification(`You must work during ${config.get('work') / 60} minutes`)
  }
})

ipcMain.on('updateTrayIcon', (event, iconName) => {
  tray.setImage(icons[iconName])
})

/* Change icon on pausing + notification */

ipcMain.on('pausing', (event, isManual) => {
  tray.setImage(icons.pausing)
  const pauseTime = config.get('pause') / 60

  if (!isManual) {
    showNotification(`You have a break of ${pauseTime} minutes.`)
  }
})

/* 
 * When the max number of cycle has been reached,
 * Show a notification
 */

ipcMain.on('finished', (event, isManual) => {
  if (!isManual) {
    showNotification('You finished the pomodoro !')
  }

  if (config.get('autoShowOnFinish')) {
    trayWindow.show()
  }
})

/* 
* When the React App is loaded
* Update the default state of the React App with the config
*/

ipcMain.on('handshake', () => {
  const currentDayIndex = config.get('lastTimeUpdated.index')
  const storeData = data.get('data')

  // default value
  let todayStreak = 0

  // Get streak if it exists
  if (storeData[currentDayIndex]) { 
    todayStreak = storeData[currentDayIndex].streak
  }

  trayWindow.webContents.send('handshake', {
    work: config.get('work'),
    pause: config.get('pause'),
    sessionStreak: todayStreak,
    numberOfCycle: config.get('numberOfCycle'),
    isDraggable: config.get('allowDrag'),
    workTillDelayedMinutes: config.get('workTillDelayedMinutes')
  })
})

/* Set new values in the config */

ipcMain.on('updateConfig', (event, data) => {
  const work = config.get('work')
  const pause = config.get('pause')
  const numberOfCycle = config.get('numberOfCycle')
  const workTillDelayedMinutes = config.get('workTillDelayedMinutes')
  const format = config.get('format')

  if (data.work && (work !== data.work)) config.set('work', data.work)
  if (data.pause && (pause !== data.pause)) config.set('pause', data.pause)
  if (data.numberOfCycle && (numberOfCycle !== data.numberOfCycle)) config.set('numberOfCycle', data.numberOfCycle)
  if (data.workTillDelayedMinutes || data.workTillDelayedMinutes === 0) {
    if (workTillDelayedMinutes !== data.workTillDelayedMinutes) config.set('workTillDelayedMinutes', data.workTillDelayedMinutes)
  }
  if (data.format && (format !== data.format)) config.set('format', data.format)
})


/**
 *
 * STREAK
 *
 */

/* Send data for charts */

ipcMain.on('getData', () => {
  const currentDayIndex = config.get('lastTimeUpdated.index')
  const storeData = data.get('data')

  /* Calculate the total worktime */
  const minutesOfWork = storeData.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.value
  }, 0)
  const totalHoursOfWork = (minutesOfWork / 60).toFixed(1)

  /* Calculate the total streak */
  const totalStreak = storeData.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.streak
  }, 0)

  /* Streak */
  let todayStreak = 0 // default value
  let todayMinutes = 0 // default value
  if (storeData[currentDayIndex]) { // Get streak if it exists
    todayStreak = storeData[currentDayIndex].streak
    todayMinutes = Math.round(storeData[currentDayIndex].value)
  }

  trayWindow.webContents.send('getData', {
    totalHoursOfWork,
    totalStreak,
    todayStreak,
    todayMinutes
  })
})

/* Data for the Bar chart */

ipcMain.on('getBarChartData', () => {
  const payload = data.get('data')
    .slice(-7)
    .map(object => ({
      t: new Date(object.day).toLocaleDateString('en-US'),
      y: object.value
    }))
  trayWindow.webContents.send('getBarChartData', payload)
})

/* Data for the Heatmap chart */

ipcMain.on('getHeatmapChartData', () => {
  const payload = data.get('data').map(object => ({
    date: object.day,
    value: object.value,
    streak: object.streak
  }))

  trayWindow.webContents.send('getHeatmapChartData', payload)
})

/* Data for counter */

ipcMain.on('getCounterData', () => {
  trayWindow.webContents.send('getCounterData', config.get('format'))
})


/* Data for Goals */

ipcMain.on('addGoal', (event, { type, value }) => {
  // Edit goals config
  const goalsConfig = config.get('goals')
  goalsConfig.push({
    type,
    value
  })

  // Save
  config.set('goals', goalsConfig)

  // Refresh the app
  event.sender.send('refreshGoals')
})

ipcMain.on('removeGoal', (event, { type, value }) => {
  const goalsConfig = config.get('goals')

  // Find the index to remove
  const index = goalsConfig.findIndex(goal => {
    return goal.type === type && goal.value === value
  })

  // Not found
  if (index === -1) return

  // Remove
  goalsConfig.splice(index, 1)

  // Save
  config.set('goals', goalsConfig)

  // Update the UI
  event.sender.send('refreshGoals')
})

ipcMain.on('getGoalsData', () => {
  const goalsCreated = config.get('goals') // [ { type: 'day', value: 60 } ]
  const localData = data.get('data')
  const types = {
    day: 1,
    week: 7,
    month: 31,
    year: 365
  }

  let payload = []

  goalsCreated.forEach(goal => {
    // Number of days to fetch
    const days = types[goal.type]
    // Fetch the x days
    const daysData = localData.slice(`-${days}`)
    // Return the total of minutes in x days
    const totalMinutes = daysData.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.value
    }, 0)
    // Compare the value of the goal and the minutes of work
    
    // If superior -> The goal is achieved
    // If inferior -> The goal is not achieved
    let isSuccess
    totalMinutes >= goal.value ? isSuccess = true : isSuccess = false

    payload.push({
      ...goal,
      currentValue: totalMinutes,
      success: isSuccess
    })
  })

  trayWindow.webContents.send('getGoalsData', payload)
})

/* Store the streak and time */

ipcMain.on('updateData', (event, timePassed) => updateData(timePassed))



/* Window events */

ipcMain.on('win-minimize', () => {
  trayWindow.hide()
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})

ipcMain.on('win-compact', () => {
  trayWindow.setBounds({height: 100})
  positioner.move(getTrayPosition(), tray.getBounds())
})

ipcMain.on('win-restore', () => {
  trayWindow.setBounds({height: 550})
  positioner.move(getTrayPosition(), tray.getBounds())
})

ipcMain.on('win-close', () => {
  if (showConfirmationBox('Do you really want to quit ?') === 0) {
    app.quit()
  }
})


/**
 *
 * FUNCTIONS
 *
 */

function createWindow () {
  trayWindow = new BrowserWindow({
    width: 400,
    height: 550,
    resizable: false,
    movable: config.get('allowDrag'),
    fullscreenable: false,
    alwaysOnTop: true,
    icon: icons.idle,
    show: false,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  if (isDev) {
    // DEVELOPMENT Load the CRA server
    trayWindow.loadURL('http://localhost:3000/')
  } else {
    // PRODUCTION Load the React build
    trayWindow.loadURL(url.format({
      protocol: 'file',
      slashes: true,
      pathname: path.join(__dirname, 'index.html')
    }))
  }

  positioner = new Positioner(trayWindow)
  positioner.move(getTrayPosition(), tray.getBounds())

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS
    } = require('electron-devtools-installer')
    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => console.log('Added extension : ', name))
      .catch(error => console.log(error))
    trayWindow.webContents.openDevTools()
  }

  trayWindow.on('ready-to-show', () => trayWindow.show())
}

function getTrayPosition () {
  if (process.platform === 'win32') {
    return 'trayBottomCenter'
  } else if (process.platform === 'darwin') {
    return 'trayCenter'
  } else {
    return 'trayRight'
  }
}

function createTray () {
  tray = new Tray(icons.idle)
  tray.setToolTip('Tempus, click to open')
  tray.on('click', () => toggleWindow())
  updateContextMenu()
}

function updateContextMenu (options) {
  let versionItem

  if (options && options.version) {
    const currentVersion = options.version.currentVersion
    const latestVersion = options.version.latestVersion
    const newVersionAvailable = currentVersion !== latestVersion
    
    versionItem = {
      label: newVersionAvailable ? `v${currentVersion} (latest: ${latestVersion})` : `v${currentVersion} (up-to-date)`,
      sublabel: newVersionAvailable ? 'Click to download latest version' : undefined,
      enabled: newVersionAvailable ? true : false,
      click () {
        shell.openExternal(`https://tempus.keziahmoselle.fr/?from=${currentVersion}`)
      }
    }
  } else {
    versionItem = {
      label: 'Fetching latest release...',
      enabled: false
    }
  }

  const settings = [
    {
      type: 'checkbox',
      checked: config.get('showNotifications'),
      label: 'Enable notifications',
      click (event) {
        config.set('showNotifications', event.checked)
      }
    },
    {
      type: 'checkbox',
      checked: config.get('autoLaunch'),
      label: 'Enable Launch At Login',
      click (event) {
        toggleAutoLaunch(event.checked)
      }
    },
    {
      type: 'checkbox',
      checked: config.get('autoHide'),
      label: 'Auto hide window on start',
      click (event) {
        config.set('autoHide', event.checked)
      }
    },
    {
      type: 'checkbox',
      checked: config.get('autoShowOnFinish'),
      label: 'Auto show window on finish',
      click (event) {
        config.set('autoShowOnFinish', event.checked)
      }
    },
    {
      type: 'checkbox',
      checked: config.get('allowDrag'),
      label: 'Enable drag window (restart)',
      click (event) {
        if (showConfirmationBox('Do you want to restart to apply changes ?') === 0) {
          config.set('allowDrag', event.checked)
          app.relaunch()
          app.quit()
        }
      }
    }
  ]

  const actions = [
    {
      label: 'Export to CSV',
      click () {
        const exportAsCsv = require('./utils/toCSV')
        exportAsCsv()
      }
    },
    {
      label: 'Delete data',
      click () {
        const action = dialog.showMessageBox({
          type: 'warning',
          message: 'This action will delete all your statistics. Are you sure ?',
          buttons: ['Delete', 'Cancel']
        })

        if (action === 0) {
          data.set('data', [])
          dialog.showMessageBox({
            type: 'info',
            message: 'Your data has been deleted.'
          })
        }
      }
    }
  ]

  const menuTemplate = [
    {
      label: 'Show/Hide...',
      click () {
        toggleWindow()
      },
      accelerator: 'CmdOrCtrl+O'
    },
    { type: 'separator' },
    {
      label: '▶ Start',
      click () {
        trayWindow.webContents.send('start')
      }
    },
    {
      label: '■ Stop',
      click () {
        trayWindow.webContents.send('stop')
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      submenu: [...settings]
    },
    {
      label: 'Actions',
      submenu: [...actions]
    },
    { type: 'separator' },
    versionItem,
    {
      label: 'Feedback && Support...',
      click () {
        shell.openExternal('https://github.com/KeziahMoselle/tempus/issues/new')
      }
    },
    {
      label: 'Quit',
      click () {
        app.quit()
      },
      accelerator: 'CmdOrCtrl+Q'
    }
  ]
  const contextMenu = Menu.buildFromTemplate(menuTemplate)

  if (process.platform === 'darwin') {
    const appMenu = Menu.buildFromTemplate([
      {
        label: 'Tempus',
        submenu: [
          menuTemplate[0],
          menuTemplate[1],
          menuTemplate[2],
          menuTemplate[3],
          menuTemplate[4],
          menuTemplate[8],
          menuTemplate[9],
          menuTemplate[10]
        ]
      },
      {
        label: 'Settings',
        submenu: [...settings]
      },
      {
        label: 'Actions',
        submenu: [...actions]
      }
    ])
    Menu.setApplicationMenu(appMenu)

    tray.on('right-click', () => {
      tray.popUpContextMenu(contextMenu)
    })
  } else {
    tray.setContextMenu(contextMenu)
    tray.on('right-click', () => tray.popUpContextMenu())
  }

  ipcMain.on('win-settings', () => {
    tray.popUpContextMenu(Menu.buildFromTemplate(settings))
  })
}

function toggleWindow () {
  if (trayWindow.isVisible()) {
    trayWindow.hide()
    if (process.platform === 'darwin') {
      app.dock.hide()
    }
  } else {
    trayWindow.show()
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  }
}

function toggleAutoLaunch (isEnabled) {
  isEnabled ? autoLauncher.enable() : autoLauncher.disable()
  config.set('autoLaunch', isEnabled)
}

function showNotification (body) {
  if (config.get('showNotifications')) {
    new Notification({
      title: 'Tempus',
      icon: process.platform === 'win32' ? icons.idle : null,
      body: body
    }).show()
  }
}

function showConfirmationBox (message) {
  const dialogOptions = {
    type: 'info',
    buttons: ['Confirm', 'Cancel'],
    message
  }

  return dialog.showMessageBox(dialogOptions)
}

async function checkForUpdates () {
  let currentVer
  let latestVer

  if (process.platform === 'darwin') {
    const notifyLatestVersion = require('./utils/notifyLatestVersion')
    const { currentVersion, latestVersion } = await notifyLatestVersion()
    currentVer = currentVersion
    latestVer = latestVersion
  } else {
    const { autoUpdater } = require('electron-updater')
    const getLatestVersion = require('./utils/getLatestVersion')
    const { currentVersion, latestVersion } = await getLatestVersion()
    currentVer = currentVersion
    latestVer = latestVersion
    autoUpdater.checkForUpdatesAndNotify()
  }

  updateContextMenu({
    version: {
      currentVersion: currentVer,
      latestVersion: latestVer
    }
  })
}

function registerGlobalShortcuts ()  {
  // Global Shortcut : Toggle Window
  const shortcutToggleWindow = globalShortcut.register('Super+Alt+Up', () => {
    toggleWindow()
  })
  if (!shortcutToggleWindow) {
    log.warn('Unable to register: Super+Alt+Up')
  }

  // Global Shortcut : Toggle Counting/Stop
  const shortcutToggleState = globalShortcut.register('Super+Alt+Down', () => {
    trayWindow.webContents.send('start')
  })
  if (!shortcutToggleState) {
    log.warn('Unable to register: Super+Alt+Down')
  }
}