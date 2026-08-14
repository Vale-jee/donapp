# Cliente móvil de DonApp

`app_flutter` contiene el cliente móvil de DonApp, desarrollado con Flutter y Dart para Android. Actualmente incluye una pantalla de comprobación que consulta `GET /api/categorias` y muestra las categorías recibidas desde el backend.

Instale las dependencias desde este directorio:

```powershell
flutter pub get
```

La URL del backend se proporciona mediante la variable de compilación `API_BASE_URL`. Con el backend local en el puerto 3000, conecte el dispositivo por USB y configure ADB reverse:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3000 tcp:3000
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

Android permite HTTP hacia `localhost` únicamente para esta conexión de desarrollo. Consulte el [README principal](../README.md) para la configuración completa del backend, Redis, dispositivo Android y entorno Flutter.
