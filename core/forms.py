from django import forms
from .models import Aprendiz, Empresa

class CargaExcelForm(forms.Form):
    archivo = forms.FileField(
        label='Archivo Excel',
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control',
            'accept': '.xlsx,.xls'
        })
    )
    
    def clean_archivo(self):
        archivo = self.cleaned_data['archivo']
        extension = archivo.name.split('.')[-1].lower()
        if extension not in ['xlsx', 'xls']:
            raise forms.ValidationError('Solo se permiten archivos Excel (.xlsx, .xls)')
        return archivo

class AprendizFilterForm(forms.Form):
    estado = forms.ChoiceField(
        choices=[('', 'Todos')] + Aprendiz.ESTADOS,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    empresa = forms.ModelChoiceField(
        queryset=Empresa.objects.all().order_by('razon_social'),
        required=False,
        empty_label='Todas las empresas',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    busqueda = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por nombre, documento o especialización...'
        })
    )
    ficha = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Número de ficha'
        })
    )

class AprendizForm(forms.ModelForm):
    class Meta:
        model = Aprendiz
        fields = [
            'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
            'email', 'telefono', 'especializacion', 'ficha',
            'etapa_electiva', 'etapa_practica',
            'estado', 'empresa_vinculada', 'observaciones'
        ]
        widgets = {
            'tipo_documento': forms.Select(attrs={'class': 'form-select'}),
            'numero_documento': forms.TextInput(attrs={'class': 'form-control'}),
            'nombres': forms.TextInput(attrs={'class': 'form-control'}),
            'apellidos': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'especializacion': forms.TextInput(attrs={'class': 'form-control'}),
            'ficha': forms.TextInput(attrs={'class': 'form-control'}),
            'etapa_electiva': forms.DateInput(attrs={
                'class': 'form-control', 'type': 'date'
            }),
            'etapa_practica': forms.DateInput(attrs={
                'class': 'form-control', 'type': 'date'
            }),
            'estado': forms.Select(attrs={'class': 'form-select'}),
            'empresa_vinculada': forms.Select(attrs={'class': 'form-select'}),
            'observaciones': forms.Textarea(attrs={
                'class': 'form-control', 'rows': 3
            }),
        }
