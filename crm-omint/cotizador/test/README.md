# Pruebas del cotizador

```bash
# Lectura de la lista (compara octubre/Mendoza contra los valores anteriores)
node cotizador/test/parse-check.mjs LISTA_NUEVA.xls LISTA_ANTERIOR.xlsx salida.json valores-anteriores.json

# Motor nuevo contra la lógica del cotizador anterior (casos al azar)
node cotizador/test/motor-vs-anterior.mjs lista.json
```

Las listas de precios no se versionan: se pasan como argumento.
