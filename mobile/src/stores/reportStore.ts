import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { 
  AccidentReport, 
  ReportPhoto, 
  ReportAudio, 
  IncidentType,
  FormField,
  Location 
} from '../types';
import { ApiService } from '../services/ApiService';
import { useSyncStore } from './syncStore';

const DRAFT_REPORTS_KEY = 'draft_reports';
const CURRENT_REPORT_KEY = 'current_report';

interface ReportStore {
  // Current report being created/edited
  currentReport: Partial<AccidentReport> | null;
  currentStep: number;
  
  // Cached reports
  reports: AccidentReport[];
  isLoading: boolean;
  
  // Form configuration
  formFields: FormField[];
  
  // Actions
  startNewReport: (incidentType: IncidentType) => void;
  updateCurrentReport: (updates: Partial<AccidentReport>) => void;
  setLocation: (location: Location) => void;
  addPhoto: (photo: ReportPhoto) => void;
  removePhoto: (photoId: string) => void;
  addAudio: (audio: ReportAudio) => void;
  removeAudio: (audioId: string) => void;
  updateCustomField: (key: string, value: any) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Submission
  saveDraft: () => Promise<void>;
  submitReport: () => Promise<void>;
  cancelReport: () => void;
  
  // Data fetching
  fetchReports: () => Promise<void>;
  fetchFormFields: () => Promise<void>;
  loadDraftReports: () => Promise<void>;
}

export const useReportStore = create<ReportStore>((set, get) => ({
  currentReport: null,
  currentStep: 0,
  reports: [],
  isLoading: false,
  formFields: [],

  startNewReport: (incidentType: IncidentType) => {
    const newReport: Partial<AccidentReport> = {
      id: uuidv4(),
      incidentType,
      status: 'draft',
      incidentDate: new Date().toISOString(),
      customFields: {},
      photos: [],
      audio: [],
      isOffline: true,
    };
    
    set({ currentReport: newReport, currentStep: 0 });
  },

  updateCurrentReport: (updates: Partial<AccidentReport>) => {
    const { currentReport } = get();
    if (currentReport) {
      set({ currentReport: { ...currentReport, ...updates } });
    }
  },

  setLocation: (location: Location) => {
    const { currentReport } = get();
    if (currentReport) {
      set({
        currentReport: {
          ...currentReport,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
      });
    }
  },

  addPhoto: (photo: ReportPhoto) => {
    const { currentReport } = get();
    if (currentReport) {
      const photos = [...(currentReport.photos || []), photo];
      set({ currentReport: { ...currentReport, photos } });
    }
  },

  removePhoto: (photoId: string) => {
    const { currentReport } = get();
    if (currentReport) {
      const photos = (currentReport.photos || []).filter(p => p.id !== photoId);
      set({ currentReport: { ...currentReport, photos } });
    }
  },

  addAudio: (audio: ReportAudio) => {
    const { currentReport } = get();
    if (currentReport) {
      const audioList = [...(currentReport.audio || []), audio];
      set({ currentReport: { ...currentReport, audio: audioList } });
    }
  },

  removeAudio: (audioId: string) => {
    const { currentReport } = get();
    if (currentReport) {
      const audioList = (currentReport.audio || []).filter(a => a.id !== audioId);
      set({ currentReport: { ...currentReport, audio: audioList } });
    }
  },

  updateCustomField: (key: string, value: any) => {
    const { currentReport } = get();
    if (currentReport) {
      const customFields = { ...currentReport.customFields, [key]: value };
      set({ currentReport: { ...currentReport, customFields } });
    }
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    const { currentStep } = get();
    set({ currentStep: currentStep + 1 });
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  saveDraft: async () => {
    const { currentReport } = get();
    if (!currentReport) return;

    try {
      // Save to local storage
      const draftsJson = await AsyncStorage.getItem(DRAFT_REPORTS_KEY);
      const drafts: AccidentReport[] = draftsJson ? JSON.parse(draftsJson) : [];
      
      const existingIndex = drafts.findIndex(d => d.id === currentReport.id);
      if (existingIndex >= 0) {
        drafts[existingIndex] = currentReport as AccidentReport;
      } else {
        drafts.push(currentReport as AccidentReport);
      }
      
      await AsyncStorage.setItem(DRAFT_REPORTS_KEY, JSON.stringify(drafts));
      
      // Add to sync queue if online
      useSyncStore.getState().addToQueue({
        entityType: 'report',
        entityId: currentReport.id!,
        operation: 'create',
        payload: currentReport,
      });
      
    } catch (error) {
      console.error('Save draft error:', error);
      throw error;
    }
  },

  submitReport: async () => {
    const { currentReport, saveDraft } = get();
    if (!currentReport) return;

    try {
      set({ isLoading: true });

      // Update status to submitted
      const updatedReport = { 
        ...currentReport, 
        status: 'submitted' as const,
        updatedAt: new Date().toISOString(),
      };
      
      set({ currentReport: updatedReport });
      
      // Try to submit online first
      const response = await ApiService.createReport(updatedReport);
      
      if (response.data) {
        // Success - update with server data
        set({ 
          currentReport: null, 
          currentStep: 0,
          isLoading: false,
        });
        
        // Remove from drafts
        const draftsJson = await AsyncStorage.getItem(DRAFT_REPORTS_KEY);
        if (draftsJson) {
          const drafts = JSON.parse(draftsJson).filter(
            (d: AccidentReport) => d.id !== currentReport.id
          );
          await AsyncStorage.setItem(DRAFT_REPORTS_KEY, JSON.stringify(drafts));
        }
        
        // Refresh reports list
        await get().fetchReports();
      } else {
        // Offline or error - save as draft for later sync
        await saveDraft();
        set({ currentReport: null, currentStep: 0, isLoading: false });
      }
      
    } catch (error) {
      console.error('Submit report error:', error);
      // Save as draft for later sync
      await get().saveDraft();
      set({ currentReport: null, currentStep: 0, isLoading: false });
    }
  },

  cancelReport: () => {
    set({ currentReport: null, currentStep: 0 });
  },

  fetchReports: async () => {
    try {
      set({ isLoading: true });
      
      const response = await ApiService.getReports();
      
      if (response.data) {
        set({ reports: response.data.reports, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      set({ isLoading: false });
    }
  },

  fetchFormFields: async () => {
    try {
      const response = await ApiService.getFormConfigs();
      
      if (response.data) {
        // Transform from snake_case to camelCase
        const fields = response.data.form_configs.map((config: any) => ({
          id: config.id,
          fieldKey: config.field_key,
          fieldType: config.field_type,
          label: config.label,
          placeholder: config.placeholder,
          isRequired: config.is_required,
          orderIndex: config.order_index,
          section: config.section,
          validationRules: config.validation_rules,
          options: config.options,
          defaultValue: config.default_value,
        }));
        
        set({ formFields: fields });
      }
    } catch (error) {
      console.error('Fetch form fields error:', error);
    }
  },

  loadDraftReports: async () => {
    try {
      const draftsJson = await AsyncStorage.getItem(DRAFT_REPORTS_KEY);
      if (draftsJson) {
        const drafts = JSON.parse(draftsJson);
        // Merge with existing reports, drafts take precedence
        const { reports } = get();
        const mergedReports = [...drafts, ...reports.filter(
          r => !drafts.some((d: AccidentReport) => d.id === r.id)
        )];
        set({ reports: mergedReports });
      }
    } catch (error) {
      console.error('Load drafts error:', error);
    }
  },
}));
