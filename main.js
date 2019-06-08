const electron = require('electron');
const url = require('url'); // The url module provides utilities for URL resolution and parsing - node.js module
const path = require('path'); // The Path module provides a way of working with directories and file paths - node.js module

const {app, BrowserWindow, Menu, ipcMain} = electron;  // pull these from electron

// SET ENV - removes the devTools for when we publish it
process.env.NODE_ENV = 'production';

let mainWindow; // main window that will list all of the items
let addWindow;  // add window that will allow us to add items

// Listen for the app to be ready
app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load html into window - passes this: file://dirname/mainWindow.html into loadURL
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),  // current dir + the file
        protocol: 'file:',
        slashes: true
    }));

    //Quit app when closed - even when the small add window is open it will close everything
    mainWindow.on('closed', function(){
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);  // bring Menu object from electron above and pass in template
    //Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle create add window
function createAddWindow(){
    // Create new window
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List Item',
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load html into window - passes this: file://dirname/mainWindow.html into loadURL
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),  // current dir + the file
        protocol: 'file:',
        slashes: true
    }));

    // Garbage collection handle - when this window is closed it won't take up memory space now
    addWindow.on('close', function(){
        addWindow = null;
    });
}

// Catch item:add from addWindow.html -> ipcMain receives (ipcMain object above)
ipcMain.on('item:add', function(e, item){   // function(event, what was sent from addWindow.html)
    mainWindow.webContents.send('item:add', item);  // sending to mainWindow
    addWindow.close();  // closes the addWindow
});

// Create menu template - an array of objects
const mainMenuTemplate = [
    //{}, -> for a mac, add an empty object so you can see File but this will leave a space in Windows
    {
        label: 'File',
        // array of objects
        submenu: [  
            {
                label: 'Add Item',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Items',
                click(){
                    mainWindow.webContents.send('item:clear'); // sending to mainWindow to clear
                }
            },
            {
                label: 'Quit',
                // Shortcut -> have to see if you are on a Mac, etc. - if mac, then _, else _
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                // click event - quits out of application
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// If mac, add empty object to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({
        label: ''
    });   // unshift - an array method that adds on to the top of the array
}

// Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                // Shortcut -> have to see if you are on a Mac, etc. - if mac, then _, else _
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                // want to show up on both windows so pass in focusedWindow
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });

}