# Angel's Project Manager

A desktop application for managing project folders and SFTP deployments. Built with Electron, this tool helps developers organize their projects, track Git repositories, and deploy code via SFTP with customizable upload/download mappings.

## Features

### Project Management
- **Organize Projects**: Add local folders or URL links as projects
- **Categorization**: Group projects by category and tags
- **Search & Sort**: Find projects quickly with search and multiple sorting options
- **Pinning**: Pin frequently used projects for easy access
- **Git Integration**: View Git status, branches, remotes, and commit history
- **Custom Images**: Add project images for visual organization

### SFTP Deployment
- **Server Management**: Store SFTP server credentials securely
- **Upload Mappings**: Configure local-to-remote path mappings for uploads
- **Download Mappings**: Set up remote-to-local mappings for downloads
- **Batch Operations**: Upload entire directories with overwrite controls
- **Connection Testing**: Verify SFTP connections before deployment

### Developer Tools
- **Cursor Integration**: Open projects directly in Cursor IDE
- **File Explorer**: Launch folders in system file explorer
- **URL Launching**: Open project URLs in default browser
- **Admin Mode**: Open Cursor with administrator privileges

### User Experience
- **Customizable Themes**: Choose from multiple color schemes
- **Responsive Design**: Clean, modern interface with grid/list views
- **Context Menus**: Right-click menus for quick actions
- **Keyboard Shortcuts**: F12 for DevTools, standard window controls

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- Windows (primary platform), with potential Linux/macOS support

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/angels-project-manager.git
   cd angels-project-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate application icon:
   ```bash
   npm run ensure-icon-ico
   ```

4. Start the application:
   ```bash
   npm start
   ```

### Building Shortcuts
To create desktop shortcuts:
```bash
npm run update-shortcut
```

## Usage

### Adding Projects
1. Click "Add project" in the toolbar
2. Choose between folder path or URL
3. Browse and select a local folder, or enter a URL
4. Add name, description, category, and tags
5. Optionally add project image

### SFTP Setup
1. Go to File → Settings → SFTP servers
2. Add server credentials (host, port, username, password/key)
3. Test connection to verify credentials
4. Assign server to project in project settings

### Upload/Download
1. Right-click project → SFTP upload
2. Configure upload mappings (local paths → remote paths)
3. Set overwrite preferences
4. Run upload or download operations

### Keyboard Shortcuts
- `F12`: Open DevTools
- `Ctrl+Shift+I`: Open DevTools (alternative)
- Standard window controls (minimize, maximize, close)

## Project Structure

```
angels-project-manager/
├── main.js              # Electron main process
├── preload.js           # Context bridge for renderer
├── server.js            # Express backend server
├── package.json         # Dependencies and scripts
├── public/              # Frontend assets
│   ├── index.html       # Main UI
│   ├── app.js           # Frontend JavaScript
│   └── styles.css       # Application styles
├── data/                # Application data (created at runtime)
│   ├── projects.json    # Project definitions
│   ├── credentials.json # SFTP credentials
│   └── project-images/  # Project thumbnails
└── scripts/             # Build utilities
    ├── ensure-icon-ico.js
    └── update-shortcut-icon.ps1
```

## API Endpoints

The application runs a local Express server on port 3847 with the following endpoints:

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PUT /api/projects/:id/image` - Upload project image

### File System
- `GET /api/browse` - Browse local directories
- `GET /api/sftp/local-list` - List local files for SFTP
- `POST /api/open-explorer` - Open folder in explorer
- `POST /api/open-cursor` - Open in Cursor IDE

### SFTP
- `GET /api/credentials` - List SFTP servers
- `POST /api/credentials` - Add SFTP server
- `PUT /api/credentials/:id` - Update server
- `DELETE /api/credentials/:id` - Delete server
- `GET /api/sftp/list` - List remote files
- `POST /api/sftp/upload` - Upload files
- `POST /api/sftp/download` - Download files
- `POST /api/credentials/test` - Test connection

### Git
- `GET /api/git-info` - Get Git repository information

## Development

### Running in Development
```bash
# Start server only
npm run server

# Start Electron app
npm start
```

### Building Icons
The application uses PNG to ICO conversion for Windows icons:
```bash
npm run ensure-icon-ico
```

### Logging
Application logs are stored in `data/app.log`. Server errors are logged with timestamps and stack traces.

## Security Notes

- SFTP credentials are stored locally in `data/credentials.json`
- Passwords are masked in the UI but stored in plain text
- Private keys should be in OpenSSH PEM format (not PuTTY .ppk)
- File paths are validated to prevent directory traversal

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and feature requests, please use the GitHub issue tracker.