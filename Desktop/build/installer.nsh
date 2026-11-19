; Copia DATA\conexiones.json (carpeta junto al instalador) a Documentos la primera vez.
; Si ya existe en la PC no lo pisa: las actualizaciones de la lista se hacen desde "Importar otro archivo".
; IMPORTANTE: guardar este archivo en UTF-8 con BOM; sin BOM, NSIS lee mal los acentos de "Validación".
!macro customInstall
  IfFileExists "$EXEDIR\DATA\conexiones.json" 0 conexiones_fin
    IfFileExists "$DOCUMENTS\Validación de Inventario\DATA\conexiones.json" conexiones_fin 0
      CreateDirectory "$DOCUMENTS\Validación de Inventario\DATA"
      CopyFiles /SILENT "$EXEDIR\DATA\conexiones.json" "$DOCUMENTS\Validación de Inventario\DATA\conexiones.json"
  conexiones_fin:
!macroend
