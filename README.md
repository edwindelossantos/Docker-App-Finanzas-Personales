# Aplicación de Gestión Financiera

Aplicación web completa para gestión financiera personal y empresarial, lista para ejecutarse en contenedores Docker.

## Características

- **Registro de ingresos y gastos** - Gestiona todas tus transacciones
- **Clasificación por categorías** - Alimentacion, Transporte, Vivienda, etc.
- **Dashboard con métricas financieras** - Visualiza tu estado financiero en tiempo real
- **Gráficos interactivos** - Tendencias y distribución de gastos
- **Presupuestos con alertas** - Establece límites y recibe notificaciones
- **Gestión quincenal** - Sistema de quincenas (1ra y 2da)
- **Metas de ahorro** - Define y seguimiento de objetivos financieros
- **Exportación de datos** - Reportes en Excel

## Usuario Administrador

- **Usuario:** admin
- **Contraseña:** admin123

## Estructura del Proyecto

```
/backend          - API REST con FastAPI (Python)
/frontend         - Interfaz React
docker-compose.yml
```

## Ejecución con Docker

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## Servicios

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **PostgreSQL:** localhost:5432

## Tecnologías

- **Backend:** Python, FastAPI, PostgreSQL, JWT
- **Frontend:** React, Chart.js
- **Contenedores:** Docker, Docker Compose