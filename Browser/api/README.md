
## Installation

Install libraries with npm

```bash
  npm install
```

## Development
    
Run developer version:
```
  node ace serve --watch
```

## Deployment

Create build version:
```
node ace build --production
```

After build folder was created (all of this need to be executed inside build folder):

- Create .env file using .env.example as reference

- Execute migrations:
  ```
  node ace migrations:run
  ```

- Start server
  ```
  node server.js
  ```
