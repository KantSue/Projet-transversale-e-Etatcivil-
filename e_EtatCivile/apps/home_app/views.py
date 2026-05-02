from django.shortcuts import render
def Acceuil(request):
    return render(request=request, template_name='acceuil.html')
# Create your views here.
