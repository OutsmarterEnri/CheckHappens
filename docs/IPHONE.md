# iPhone

Run `npm ci`, `npm run build`, then `node scripts/serve.mjs --lan`. On Windows, `IPHONE.cmd` launches this server after a build. Connect the iPhone to the same Wi-Fi and open the printed `http://COMPUTER-IP:4173` URL in Safari. If necessary, allow the server on your private network. Keep the computer running.

Use portrait orientation for the full-size board. The gameplay page uses dynamic viewport height and safe-area insets, with secondary information in dialogs. Small boards necessarily have smaller squares; the main action and menu buttons remain touch-sized. Safari browser chrome may resize the available viewport.

For a standalone Home Screen app and reliable offline caching, serve the build from a secure HTTPS origin and add it to Home Screen. Service workers are enabled only in secure contexts (localhost on the computer also qualifies). Plain LAN HTTP can play but does not qualify for offline caching on iPhone. No publishing or external tunnel is automatically activated.

The application is a web app, not a signed native iOS/App Store package. Browser viewport tests emulate phone sizes; physical iPhone/Safari verification should be performed before a public release. Match logs save on the current device and origin. Changing URL/port or clearing browser data may give a separate save.
