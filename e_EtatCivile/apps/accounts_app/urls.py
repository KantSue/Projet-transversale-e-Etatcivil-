from . import services

from . import views
from django.urls import path

urlpatterns = [
    # path('register/',views.Agent_register,name='register'),
    # path('register1/',views.Admin_register,name='register1'),
    path('register2/',views.Citoyen_register,name='register2'),
    path('details/',views.detals,name='details'),
    path('login/',views.login,name='login'),
    path('logout/',views.logout,name='logout'),
]
