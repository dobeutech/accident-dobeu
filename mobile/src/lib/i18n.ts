import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Localization from 'expo-localization';

export type Language = 'en' | 'es' | 'fr';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    'app.name': 'FleetGuard',
    'app.tagline': 'Document accidents quickly',

    // Navigation
    'nav.home': 'Home',
    'nav.reports': 'Reports',
    'nav.profile': 'Profile',

    // Home
    'home.welcome': 'Welcome back',
    'home.quickReport': 'Quick Report',
    'home.reportAccident': 'Report Accident',
    'home.reportIncident': 'Report Injury/Incident',
    'home.reportNearMiss': 'Report Near Miss',
    'home.recentReports': 'Recent Reports',
    'home.noReports': 'No recent reports',
    'home.offlineMode': 'Offline Mode - Data will sync when connected',

    // Reports
    'reports.title': 'My Reports',
    'reports.search': 'Search reports...',
    'reports.noReports': 'No reports found',
    'reports.filter.all': 'All',
    'reports.filter.draft': 'Drafts',
    'reports.filter.submitted': 'Submitted',

    // Incident Types
    'incident.accident': 'Vehicle Accident',
    'incident.incident': 'Injury/Incident',
    'incident.nearMiss': 'Near Miss',

    // Status
    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.synced': 'Synced',
    'status.pending': 'Pending Sync',

    // Wizard Steps
    'wizard.step1': 'Incident Type',
    'wizard.step2': 'Location',
    'wizard.step3': 'Photos',
    'wizard.step4': 'Vehicle Info',
    'wizard.step5': 'Other Party',
    'wizard.step6': 'Witnesses',
    'wizard.step7': 'Statement',
    'wizard.step8': 'Signature',
    'wizard.step9': 'Review',

    // Step 1 - Incident Type
    'step1.title': 'What type of incident?',
    'step1.subtitle': 'Select the type that best describes what happened',
    'step1.accident.desc': 'Collision with vehicle, property, or object',
    'step1.incident.desc': 'Personal injury or non-collision incident',
    'step1.nearMiss.desc': 'Close call that could have resulted in accident',

    // Step 2 - Location
    'step2.title': 'Where did it happen?',
    'step2.subtitle': 'Confirm or adjust the incident location',
    'step2.gps': 'GPS Location',
    'step2.address': 'Address',
    'step2.intersection': 'Nearest Intersection',
    'step2.landmark': 'Landmark/Reference',
    'step2.refreshLocation': 'Refresh Location',

    // Step 3 - Photos
    'step3.title': 'Capture Photos',
    'step3.subtitle': 'Document the scene with photos',
    'step3.takePhoto': 'Take Photo',
    'step3.fromGallery': 'From Gallery',
    'step3.suggestions': 'Recommended Photos',
    'step3.overall': 'Overall Scene',
    'step3.damage': 'Vehicle Damage',
    'step3.otherVehicle': 'Other Vehicle(s)',
    'step3.roadConditions': 'Road Conditions',
    'step3.weatherConditions': 'Weather/Visibility',
    'step3.skidMarks': 'Skid Marks/Debris',

    // Step 4 - Vehicle Info
    'step4.title': 'Your Vehicle',
    'step4.subtitle': 'Enter information about your vehicle',
    'step4.unitId': 'Unit/Vehicle ID',
    'step4.year': 'Year',
    'step4.make': 'Make',
    'step4.model': 'Model',
    'step4.licensePlate': 'License Plate',
    'step4.vin': 'VIN',
    'step4.damageDescription': 'Describe the damage',
    'step4.drivable': 'Is the vehicle drivable?',
    'step4.towRequired': 'Tow required?',
    'step4.cargoAffected': 'Cargo affected?',

    // Step 5 - Other Party
    'step5.title': 'Other Party',
    'step5.subtitle': 'Information about other involved parties',
    'step5.addParty': 'Add Other Party',
    'step5.driverName': 'Driver Name',
    'step5.phone': 'Phone Number',
    'step5.license': 'License Number',
    'step5.insurance': 'Insurance Company',
    'step5.policyNumber': 'Policy Number',
    'step5.vehicleMake': 'Vehicle Make',
    'step5.vehicleModel': 'Vehicle Model',
    'step5.vehiclePlate': 'License Plate',

    // Step 6 - Witnesses
    'step6.title': 'Witnesses',
    'step6.subtitle': 'Add any witnesses to the incident',
    'step6.addWitness': 'Add Witness',
    'step6.name': 'Full Name',
    'step6.phone': 'Phone Number',
    'step6.statement': 'Brief Statement',

    // Step 7 - Statement
    'step7.title': 'Your Statement',
    'step7.subtitle': 'Describe what happened in your own words',
    'step7.written': 'Written Statement',
    'step7.audio': 'Voice Recording',
    'step7.startRecording': 'Start Recording',
    'step7.stopRecording': 'Stop Recording',
    'step7.placeholder': 'Describe the events leading up to and during the incident...',

    // Step 8 - Signature
    'step8.title': 'Sign and Confirm',
    'step8.subtitle': 'Review and sign to confirm accuracy',
    'step8.acknowledgment': 'I confirm that all information provided is true and accurate to the best of my knowledge.',
    'step8.clear': 'Clear Signature',
    'step8.sign': 'Sign above',

    // Step 9 - Review
    'step9.title': 'Review Report',
    'step9.subtitle': 'Review all information before submitting',
    'step9.complete': 'Complete',
    'step9.incomplete': 'Incomplete',
    'step9.required': 'Required',
    'step9.optional': 'Optional',

    // Actions
    'action.next': 'Next',
    'action.previous': 'Previous',
    'action.submit': 'Submit Report',
    'action.saveDraft': 'Save Draft',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.retry': 'Retry',

    // Alerts
    'alert.unsavedChanges': 'Unsaved Changes',
    'alert.unsavedMessage': 'You have unsaved changes. Save as draft or discard?',
    'alert.discard': 'Discard',
    'alert.saveDraft': 'Save Draft',
    'alert.submitSuccess': 'Report submitted successfully',
    'alert.submitError': 'Failed to submit report. It will be synced when online.',
    'alert.draftSaved': 'Draft saved',

    // Profile
    'profile.title': 'Profile',
    'profile.signOut': 'Sign Out',
    'profile.language': 'Language',
    'profile.syncStatus': 'Sync Status',
    'profile.pendingUploads': 'Pending Uploads',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.signInButton': 'Sign In',
  },

  es: {
    // App
    'app.name': 'FleetGuard',
    'app.tagline': 'Documente accidentes rápidamente',

    // Navigation
    'nav.home': 'Inicio',
    'nav.reports': 'Reportes',
    'nav.profile': 'Perfil',

    // Home
    'home.welcome': 'Bienvenido de nuevo',
    'home.quickReport': 'Reporte Rápido',
    'home.reportAccident': 'Reportar Accidente',
    'home.reportIncident': 'Reportar Lesión/Incidente',
    'home.reportNearMiss': 'Reportar Casi Accidente',
    'home.recentReports': 'Reportes Recientes',
    'home.noReports': 'Sin reportes recientes',
    'home.offlineMode': 'Modo Sin Conexión - Los datos se sincronizarán al conectarse',

    // Reports
    'reports.title': 'Mis Reportes',
    'reports.search': 'Buscar reportes...',
    'reports.noReports': 'No se encontraron reportes',
    'reports.filter.all': 'Todos',
    'reports.filter.draft': 'Borradores',
    'reports.filter.submitted': 'Enviados',

    // Incident Types
    'incident.accident': 'Accidente Vehicular',
    'incident.incident': 'Lesión/Incidente',
    'incident.nearMiss': 'Casi Accidente',

    // Status
    'status.draft': 'Borrador',
    'status.submitted': 'Enviado',
    'status.synced': 'Sincronizado',
    'status.pending': 'Sincronización Pendiente',

    // Wizard Steps
    'wizard.step1': 'Tipo de Incidente',
    'wizard.step2': 'Ubicación',
    'wizard.step3': 'Fotos',
    'wizard.step4': 'Info del Vehículo',
    'wizard.step5': 'Otra Parte',
    'wizard.step6': 'Testigos',
    'wizard.step7': 'Declaración',
    'wizard.step8': 'Firma',
    'wizard.step9': 'Revisión',

    // Step 1 - Incident Type
    'step1.title': '¿Qué tipo de incidente?',
    'step1.subtitle': 'Seleccione el tipo que mejor describe lo que sucedió',
    'step1.accident.desc': 'Colisión con vehículo, propiedad u objeto',
    'step1.incident.desc': 'Lesión personal o incidente sin colisión',
    'step1.nearMiss.desc': 'Situación cercana que pudo resultar en accidente',

    // Step 2 - Location
    'step2.title': '¿Dónde ocurrió?',
    'step2.subtitle': 'Confirme o ajuste la ubicación del incidente',
    'step2.gps': 'Ubicación GPS',
    'step2.address': 'Dirección',
    'step2.intersection': 'Intersección más cercana',
    'step2.landmark': 'Punto de referencia',
    'step2.refreshLocation': 'Actualizar Ubicación',

    // Step 3 - Photos
    'step3.title': 'Capturar Fotos',
    'step3.subtitle': 'Documente la escena con fotos',
    'step3.takePhoto': 'Tomar Foto',
    'step3.fromGallery': 'Desde Galería',
    'step3.suggestions': 'Fotos Recomendadas',
    'step3.overall': 'Escena General',
    'step3.damage': 'Daños al Vehículo',
    'step3.otherVehicle': 'Otro(s) Vehículo(s)',
    'step3.roadConditions': 'Condiciones del Camino',
    'step3.weatherConditions': 'Clima/Visibilidad',
    'step3.skidMarks': 'Marcas de Frenado/Escombros',

    // Step 4 - Vehicle Info
    'step4.title': 'Su Vehículo',
    'step4.subtitle': 'Ingrese información sobre su vehículo',
    'step4.unitId': 'ID de Unidad/Vehículo',
    'step4.year': 'Año',
    'step4.make': 'Marca',
    'step4.model': 'Modelo',
    'step4.licensePlate': 'Placa',
    'step4.vin': 'VIN',
    'step4.damageDescription': 'Describa los daños',
    'step4.drivable': '¿El vehículo puede circular?',
    'step4.towRequired': '¿Necesita grúa?',
    'step4.cargoAffected': '¿Carga afectada?',

    // Step 5 - Other Party
    'step5.title': 'Otra Parte',
    'step5.subtitle': 'Información sobre otras partes involucradas',
    'step5.addParty': 'Agregar Otra Parte',
    'step5.driverName': 'Nombre del Conductor',
    'step5.phone': 'Teléfono',
    'step5.license': 'Número de Licencia',
    'step5.insurance': 'Compañía de Seguros',
    'step5.policyNumber': 'Número de Póliza',
    'step5.vehicleMake': 'Marca del Vehículo',
    'step5.vehicleModel': 'Modelo del Vehículo',
    'step5.vehiclePlate': 'Placa',

    // Step 6 - Witnesses
    'step6.title': 'Testigos',
    'step6.subtitle': 'Agregue cualquier testigo del incidente',
    'step6.addWitness': 'Agregar Testigo',
    'step6.name': 'Nombre Completo',
    'step6.phone': 'Teléfono',
    'step6.statement': 'Declaración Breve',

    // Step 7 - Statement
    'step7.title': 'Su Declaración',
    'step7.subtitle': 'Describa lo que sucedió con sus propias palabras',
    'step7.written': 'Declaración Escrita',
    'step7.audio': 'Grabación de Voz',
    'step7.startRecording': 'Iniciar Grabación',
    'step7.stopRecording': 'Detener Grabación',
    'step7.placeholder': 'Describa los eventos previos y durante el incidente...',

    // Step 8 - Signature
    'step8.title': 'Firmar y Confirmar',
    'step8.subtitle': 'Revise y firme para confirmar la precisión',
    'step8.acknowledgment': 'Confirmo que toda la información proporcionada es verdadera y precisa según mi mejor conocimiento.',
    'step8.clear': 'Borrar Firma',
    'step8.sign': 'Firme arriba',

    // Step 9 - Review
    'step9.title': 'Revisar Reporte',
    'step9.subtitle': 'Revise toda la información antes de enviar',
    'step9.complete': 'Completo',
    'step9.incomplete': 'Incompleto',
    'step9.required': 'Requerido',
    'step9.optional': 'Opcional',

    // Actions
    'action.next': 'Siguiente',
    'action.previous': 'Anterior',
    'action.submit': 'Enviar Reporte',
    'action.saveDraft': 'Guardar Borrador',
    'action.cancel': 'Cancelar',
    'action.confirm': 'Confirmar',
    'action.delete': 'Eliminar',
    'action.edit': 'Editar',
    'action.retry': 'Reintentar',

    // Alerts
    'alert.unsavedChanges': 'Cambios sin Guardar',
    'alert.unsavedMessage': 'Tiene cambios sin guardar. ¿Guardar como borrador o descartar?',
    'alert.discard': 'Descartar',
    'alert.saveDraft': 'Guardar Borrador',
    'alert.submitSuccess': 'Reporte enviado exitosamente',
    'alert.submitError': 'Error al enviar reporte. Se sincronizará cuando esté en línea.',
    'alert.draftSaved': 'Borrador guardado',

    // Profile
    'profile.title': 'Perfil',
    'profile.signOut': 'Cerrar Sesión',
    'profile.language': 'Idioma',
    'profile.syncStatus': 'Estado de Sincronización',
    'profile.pendingUploads': 'Cargas Pendientes',

    // Auth
    'auth.signIn': 'Iniciar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.forgotPassword': '¿Olvidó su Contraseña?',
    'auth.signInButton': 'Iniciar Sesión',
  },

  fr: {
    // App
    'app.name': 'FleetGuard',
    'app.tagline': 'Documentez les accidents rapidement',

    // Navigation
    'nav.home': 'Accueil',
    'nav.reports': 'Rapports',
    'nav.profile': 'Profil',

    // Home
    'home.welcome': 'Bon retour',
    'home.quickReport': 'Rapport Rapide',
    'home.reportAccident': 'Signaler un Accident',
    'home.reportIncident': 'Signaler une Blessure/Incident',
    'home.reportNearMiss': 'Signaler un Quasi-Accident',
    'home.recentReports': 'Rapports Récents',
    'home.noReports': 'Aucun rapport récent',
    'home.offlineMode': 'Mode Hors Ligne - Les données seront synchronisées une fois connecté',

    // Reports
    'reports.title': 'Mes Rapports',
    'reports.search': 'Rechercher des rapports...',
    'reports.noReports': 'Aucun rapport trouvé',
    'reports.filter.all': 'Tous',
    'reports.filter.draft': 'Brouillons',
    'reports.filter.submitted': 'Soumis',

    // Incident Types
    'incident.accident': 'Accident de Véhicule',
    'incident.incident': 'Blessure/Incident',
    'incident.nearMiss': 'Quasi-Accident',

    // Status
    'status.draft': 'Brouillon',
    'status.submitted': 'Soumis',
    'status.synced': 'Synchronisé',
    'status.pending': 'Synchronisation en Attente',

    // Wizard Steps
    'wizard.step1': 'Type d\'Incident',
    'wizard.step2': 'Emplacement',
    'wizard.step3': 'Photos',
    'wizard.step4': 'Info Véhicule',
    'wizard.step5': 'Autre Partie',
    'wizard.step6': 'Témoins',
    'wizard.step7': 'Déclaration',
    'wizard.step8': 'Signature',
    'wizard.step9': 'Révision',

    // Step 1 - Incident Type
    'step1.title': 'Quel type d\'incident?',
    'step1.subtitle': 'Sélectionnez le type qui décrit le mieux ce qui s\'est passé',
    'step1.accident.desc': 'Collision avec véhicule, propriété ou objet',
    'step1.incident.desc': 'Blessure personnelle ou incident sans collision',
    'step1.nearMiss.desc': 'Situation proche qui aurait pu entraîner un accident',

    // Step 2 - Location
    'step2.title': 'Où cela s\'est-il passé?',
    'step2.subtitle': 'Confirmez ou ajustez l\'emplacement de l\'incident',
    'step2.gps': 'Position GPS',
    'step2.address': 'Adresse',
    'step2.intersection': 'Intersection la plus proche',
    'step2.landmark': 'Point de repère',
    'step2.refreshLocation': 'Actualiser la Position',

    // Step 3 - Photos
    'step3.title': 'Capturer des Photos',
    'step3.subtitle': 'Documentez la scène avec des photos',
    'step3.takePhoto': 'Prendre une Photo',
    'step3.fromGallery': 'Depuis la Galerie',
    'step3.suggestions': 'Photos Recommandées',
    'step3.overall': 'Scène Générale',
    'step3.damage': 'Dommages au Véhicule',
    'step3.otherVehicle': 'Autre(s) Véhicule(s)',
    'step3.roadConditions': 'Conditions Routières',
    'step3.weatherConditions': 'Météo/Visibilité',
    'step3.skidMarks': 'Traces de Freinage/Débris',

    // Step 4 - Vehicle Info
    'step4.title': 'Votre Véhicule',
    'step4.subtitle': 'Entrez les informations sur votre véhicule',
    'step4.unitId': 'ID Unité/Véhicule',
    'step4.year': 'Année',
    'step4.make': 'Marque',
    'step4.model': 'Modèle',
    'step4.licensePlate': 'Plaque d\'Immatriculation',
    'step4.vin': 'VIN',
    'step4.damageDescription': 'Décrivez les dommages',
    'step4.drivable': 'Le véhicule peut-il rouler?',
    'step4.towRequired': 'Remorquage nécessaire?',
    'step4.cargoAffected': 'Cargaison affectée?',

    // Step 5 - Other Party
    'step5.title': 'Autre Partie',
    'step5.subtitle': 'Informations sur les autres parties impliquées',
    'step5.addParty': 'Ajouter une Autre Partie',
    'step5.driverName': 'Nom du Conducteur',
    'step5.phone': 'Téléphone',
    'step5.license': 'Numéro de Permis',
    'step5.insurance': 'Compagnie d\'Assurance',
    'step5.policyNumber': 'Numéro de Police',
    'step5.vehicleMake': 'Marque du Véhicule',
    'step5.vehicleModel': 'Modèle du Véhicule',
    'step5.vehiclePlate': 'Plaque d\'Immatriculation',

    // Step 6 - Witnesses
    'step6.title': 'Témoins',
    'step6.subtitle': 'Ajoutez tout témoin de l\'incident',
    'step6.addWitness': 'Ajouter un Témoin',
    'step6.name': 'Nom Complet',
    'step6.phone': 'Téléphone',
    'step6.statement': 'Déclaration Brève',

    // Step 7 - Statement
    'step7.title': 'Votre Déclaration',
    'step7.subtitle': 'Décrivez ce qui s\'est passé avec vos propres mots',
    'step7.written': 'Déclaration Écrite',
    'step7.audio': 'Enregistrement Vocal',
    'step7.startRecording': 'Démarrer l\'Enregistrement',
    'step7.stopRecording': 'Arrêter l\'Enregistrement',
    'step7.placeholder': 'Décrivez les événements avant et pendant l\'incident...',

    // Step 8 - Signature
    'step8.title': 'Signer et Confirmer',
    'step8.subtitle': 'Vérifiez et signez pour confirmer l\'exactitude',
    'step8.acknowledgment': 'Je confirme que toutes les informations fournies sont vraies et exactes au meilleur de ma connaissance.',
    'step8.clear': 'Effacer la Signature',
    'step8.sign': 'Signez ci-dessus',

    // Step 9 - Review
    'step9.title': 'Vérifier le Rapport',
    'step9.subtitle': 'Vérifiez toutes les informations avant de soumettre',
    'step9.complete': 'Complet',
    'step9.incomplete': 'Incomplet',
    'step9.required': 'Requis',
    'step9.optional': 'Optionnel',

    // Actions
    'action.next': 'Suivant',
    'action.previous': 'Précédent',
    'action.submit': 'Soumettre le Rapport',
    'action.saveDraft': 'Enregistrer le Brouillon',
    'action.cancel': 'Annuler',
    'action.confirm': 'Confirmer',
    'action.delete': 'Supprimer',
    'action.edit': 'Modifier',
    'action.retry': 'Réessayer',

    // Alerts
    'alert.unsavedChanges': 'Modifications non Enregistrées',
    'alert.unsavedMessage': 'Vous avez des modifications non enregistrées. Enregistrer comme brouillon ou annuler?',
    'alert.discard': 'Annuler',
    'alert.saveDraft': 'Enregistrer le Brouillon',
    'alert.submitSuccess': 'Rapport soumis avec succès',
    'alert.submitError': 'Échec de la soumission. Le rapport sera synchronisé en ligne.',
    'alert.draftSaved': 'Brouillon enregistré',

    // Profile
    'profile.title': 'Profil',
    'profile.signOut': 'Déconnexion',
    'profile.language': 'Langue',
    'profile.syncStatus': 'État de Synchronisation',
    'profile.pendingUploads': 'Téléchargements en Attente',

    // Auth
    'auth.signIn': 'Se Connecter',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de Passe',
    'auth.forgotPassword': 'Mot de Passe Oublié?',
    'auth.signInButton': 'Se Connecter',
  },
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (lang: Language) => {
        set({ language: lang });
      },

      t: (key: string, params?: Record<string, string | number>) => {
        const { language } = get();
        let text = translations[language][key] || translations['en'][key] || key;

        // Replace parameters like {count}
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
          });
        }

        return text;
      },
    }),
    {
      name: 'fleetguard-mobile-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Language labels for UI
export const languageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

// Helper to detect device language
export function detectDeviceLanguage(): Language {
  const deviceLang = Localization.locale.split('-')[0];
  if (deviceLang === 'es' || deviceLang === 'fr') {
    return deviceLang as Language;
  }
  return 'en';
}
