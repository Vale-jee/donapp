# DonApp

DonApp facilita la publicación y consulta de donaciones entre personas de una misma ciudad. El repositorio reúne una API REST, persistencia en PostgreSQL, procesamiento asíncrono con Redis y un cliente móvil Flutter inicial.

## Estado actual

Actualmente el proyecto cuenta con:

- un backend funcional construido con Next.js Pages Router y TypeScript;
- autenticación, sesiones, control de los roles `ADMIN` y `USUARIO`, y rutas protegidas;
- gestión implementada de categorías y donaciones dentro del alcance descrito más adelante;
- optimizaciones mediante selección explícita de campos, eager loading, caché y eliminación de consultas redundantes;
- procesamiento asíncrono de la notificación asociada a la creación de una donación;
- un cliente Flutter base que realiza una conexión real con la API.

## Tecnologías

### Backend

- Next.js 16.2.10 y React 19.2.4.
- TypeScript 5.x.
- Prisma ORM y Prisma Client 7.8.x.
- PostgreSQL.
- Zod 4.4.x.
- JWT mediante `jose` 6.2.x.
- Hash de contraseñas mediante `bcryptjs` 3.0.x.
- BullMQ 5.80.x e ioredis 5.11.x.
- Redis.

### Cliente móvil

- Flutter 3.47.0, canal `stable`.
- Dart 3.13.0.
- `package:http` 1.6.0.
- Android.

## Arquitectura y base del backend

El backend funcional utiliza Next.js Pages Router y TypeScript para exponer la API REST, Prisma ORM para el acceso a datos y PostgreSQL para la persistencia.

Las rutas REST se encuentran en `src/pages/api/`. La autenticación, los servicios, la caché, la cola y las validaciones se organizan en `src/lib/`, con selección explícita de campos y respuestas uniformes.

## Autenticación y usuarios

- Registro de usuarios con asignación automática del rol `USUARIO`.
- Login por correo y contraseña.
- Emisión y validación de access tokens JWT.
- Refresh tokens aleatorios almacenados mediante hash, con rotación al renovarlos.
- Sesiones persistentes y logout de la sesión asociada al refresh token.
- Comprobación de sesión, usuario activo y rol actual en las rutas protegidas.
- Control de acceso para los roles `ADMIN` y `USUARIO`.
- Consulta y actualización protegidas del perfil propio.

Las rutas disponibles son `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` y `GET|PATCH /api/usuarios/perfil`.

## Categorías

- `GET /api/categorias`: listado público de categorías activas.
- `POST /api/categorias`: creación protegida para usuarios con rol `ADMIN`.
- Selección exclusiva de los campos públicos en el listado.
- Caché local cache-aside con TTL de 60 segundos.
- Invalidación explícita de la caché después de crear una categoría.

## Donaciones

- Creación de donaciones con categoría e imágenes mediante `POST /api/donaciones`.
- Listado paginado de donaciones disponibles mediante `GET /api/donaciones`.
- Listado paginado de publicaciones propias mediante `GET /api/donaciones/mias`.
- Detalle mediante `GET /api/donaciones/{id}`.
- Actualización parcial por el propietario mediante `PATCH /api/donaciones/{id}`.
- Retiro lógico e idempotente mediante `PATCH /api/donaciones/{id}/estado`.
- Filtros de visibilidad, ciudad, propiedad, categoría y estado según la operación.
- Carga optimizada de categoría, imágenes y conteos mediante relaciones y selecciones explícitas.

No se presentan como implementadas las operaciones de solicitudes, chat, calificaciones, administración ni la confirmación de entrega, aunque existan modelos o decisiones documentales relacionadas.

## Optimización del backend

- `scripts/benchmark-donaciones-n1.ts` reproduce una estrategia con riesgo N+1 y la compara con eager loading, conteos y selección de campos.
- El servicio de donaciones utiliza consultas relacionales para evitar consultas repetidas por cada publicación.
- La autenticación carga sesión, usuario, ciudad y rol mediante una sola consulta relacional y campos seleccionados.
- `scripts/benchmark-auth-redundant-query.ts` compara la consulta redundante del usuario autenticado con la estrategia consolidada.
- `scripts/benchmark-worker-before.ts` ofrece una línea base síncrona para comparar el trabajo procesado fuera de la solicitud.

Los scripts informan sus propias métricas al ejecutarse; este documento no fija resultados numéricos dependientes del entorno.

## Procesamiento asíncrono

La creación de una donación agrega mediante BullMQ el trabajo `donation-created` a la cola `donation-notifications`. Redis actúa como infraestructura de la cola y `scripts/donation-worker.ts` ejecuta el worker.

En el estado actual, el trabajo representa el procesamiento asíncrono de una notificación de donación creada. No constituye todavía un sistema completo de entrega de notificaciones al usuario.

## Estructura del repositorio

```text
donapp/
├── app_flutter/       # Cliente móvil Flutter y configuración Android
├── prisma/            # Esquema, migraciones y seed de PostgreSQL
├── scripts/           # Worker y herramientas reproducibles de benchmark
├── spec/              # Especificaciones, planes y evolución técnica
├── src/
│   ├── lib/           # Autenticación, servicios, caché, cola y validaciones
│   └── pages/api/     # Rutas REST de Next.js Pages Router
├── package.json       # Dependencias y comandos del backend
└── README.md          # Documentación principal
```

## Configuración y ejecución del backend

Instale las dependencias desde la raíz:

```powershell
yarn install
```

Copie `.env.example` como `.env` y configure valores locales seguros para estas variables:

- `DATABASE_URL`
- `AUTH_ACCESS_TOKEN_SECRET`
- `AUTH_ACCESS_TOKEN_TTL`
- `REDIS_URL`

No versione `.env` ni publique sus valores. Con PostgreSQL disponible y la configuración correspondiente aplicada, inicie la API:

```powershell
yarn dev
```

El servidor de desarrollo queda disponible normalmente en `http://localhost:3000`.

Mantenga una instancia de Redis accesible mediante `REDIS_URL`. En otra terminal, desde la raíz, inicie el worker:

```powershell
yarn worker:donations
```

El backend, Redis y el worker deben permanecer activos para procesar el trabajo asíncrono creado por `POST /api/donaciones`.

## Cliente móvil Flutter

### Estado actual del cliente

El cliente móvil no representa todavía una aplicación completa. Actualmente ofrece una pantalla funcional para consultar las categorías del backend y mostrar el resultado de la conexión.

### Entorno utilizado

El entorno móvil verificado utiliza Flutter 3.47.0 en el canal `stable`, Dart 3.13.0, Visual Studio Code con la extensión Flutter/Dart, Android Studio Quail 3 | 2026.1.3, Android SDK y un dispositivo Android físico con Android 16 / API 36.

### Verificación del entorno

Verifique las herramientas:

```powershell
flutter doctor -v
flutter devices
```

El resultado esperado de `flutter doctor -v` es `No issues found`, y `flutter devices` debe mostrar el dispositivo disponible.

### Dispositivo físico

El cliente se ha ejecutado en un dispositivo Android físico. Conecte el dispositivo por USB y habilite las Opciones de desarrollador y la Depuración USB.

### Proyecto base y hot reload

El cliente vive en `app_flutter/` y corresponde a la base Flutter de DonApp.

### Configuración de API_BASE_URL

La URL del backend se proporciona mediante la variable de compilación `API_BASE_URL`.

### ADB reverse y conexión local

Reenvíe el puerto 3000. Esta variante funciona aunque `adb` no esté agregado a `PATH`:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3000 tcp:3000
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse --list
```

`adb reverse` reenvía el puerto del dispositivo al backend del equipo; por eso la aplicación utiliza `http://localhost:3000`.

### Seguridad de red Android

Durante el desarrollo por USB, Android permite HTTP sin cifrar únicamente hacia `localhost` mediante `network_security_config.xml`; el resto del tráfico HTTP permanece denegado por defecto.

La excepción de Android en `android/app/src/main/res/xml/network_security_config.xml` no debe ampliarse a cualquier dominio ni utilizarse como configuración general de producción.

### Conexión con la API

La pantalla de comprobación consume `GET /api/categorias`, muestra la cantidad y los nombres recibidos, e informa errores de configuración o conexión.

### Ejecución del cliente Flutter

Desde `app_flutter/`:

```powershell
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

## Seguridad

- Las contraseñas se almacenan mediante hash con bcrypt; no se conservan en texto plano.
- Los access tokens JWT se vinculan a sesiones persistentes y los refresh tokens se almacenan mediante hash.
- Las rutas protegidas verifican sesión, estado activo del usuario y, cuando corresponde, rol.
- Los secretos y direcciones de infraestructura se gestionan mediante variables de entorno.
- La excepción HTTP para `localhost` está acotada al desarrollo móvil con ADB reverse.

Estas medidas reducen riesgos concretos, pero no constituyen una garantía absoluta de seguridad ni reemplazan una revisión antes de desplegar.

## Documentación técnica

Las decisiones funcionales y técnicas de cada módulo se encuentran en `spec/features/`. Cada feature contiene su especificación, plan y registro de tareas. `spec/constitution/roadmap.md` conserva la planificación y evolución global del proyecto.

Estos documentos pueden incluir trabajo previsto, estados históricos o funcionalidades pendientes; la existencia de una decisión documental no implica por sí sola que esté implementada en el código actual.
