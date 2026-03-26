from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("reportes/", views.reportes, name="reportes"),
    path("carga-excel-nueva/", views.carga_excel_nueva, name="carga_excel_nueva"),
    path("procesar-carga-multiple/", views.procesar_carga_multiple, name="procesar_carga_multiple"),
    path("estadisticas-etapas/", views.estadisticas_etapas, name="estadisticas_etapas"),
    path("eliminacion-masiva-aprendices/", views.eliminacion_masiva_aprendices, name="eliminacion_masiva_aprendices"),
    path("eliminar-todos-aprendices/", views.eliminar_todos_aprendices, name="eliminar_todos_aprendices"),
    path("obtener-todos-ids-aprendices/", views.obtener_todos_ids_aprendices, name="obtener_todos_ids_aprendices"),
    path("aprendices/", views.lista_aprendices, name="lista_aprendices"),
    path("aprendices/<int:pk>/", views.detalle_aprendiz, name="detalle_aprendiz"),
    path("aprendices/<int:pk>/editar/", views.editar_aprendiz, name="editar_aprendiz"),
    path("aprendices/<int:pk>/eliminar/", views.eliminar_aprendiz, name="eliminar_aprendiz"),
    path("aprendices/<int:pk>/eliminar-ajax/", views.eliminar_aprendiz_ajax, name="eliminar_aprendiz_ajax"),
]
