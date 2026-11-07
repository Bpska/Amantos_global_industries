# PWA deployment

The app is a static PWA. Docker builds only `web/` and serves it through Nginx.
No API, PostgreSQL, or Expo service is required.

From the repository root:

```powershell
docker compose up -d --build
```

Open http://localhost:8012. `WEB_PORT` and `HTTPS_PORT` can be set in `.env`;
see `.env.example`. HTTPS uses a temporary certificate until you set up TLS.

For `industri.heylane.in`, point DNS to the server. Route public port 80 to
this container's HTTP port (host port 8012 by default) for certificate validation,
and allow public port 443. Then run:

```powershell
.\docker\init-ssl.ps1 -Domain industri.heylane.in -Email your-email@example.com
```

On Linux, run `bash docker/init-ssl.sh industri.heylane.in your-email@example.com`.
The Nginx hostname and certificate path are configured for `industri.heylane.in`;
update its config and entrypoint together if changing the domain.

Both roles sign in at `/login`; `/` opens the current user's panel. Admins use
`/admin` and staff use `/staff`. Nginx serves the PWA for both routes. Data stays
in each browser's localStorage; it is not shared between devices.

```powershell
docker compose logs -f web
docker compose down
```

Certbot renews certificates automatically. Reload Nginx after renewal with
`docker compose exec web nginx -s reload`.
