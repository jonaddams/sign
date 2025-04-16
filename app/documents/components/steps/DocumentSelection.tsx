'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { extractFileExtension } from '@/lib/file-utils';
import { useEffect, useState } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';

interface Template {
  id: string;
  name: string;
  createdAt: string;
  templateFilePath: string;
  description?: string;
}

export default function DocumentSelection() {
  const { state, dispatch } = useDocumentFlow();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load document templates',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Validate step when document is selected or uploaded
  useEffect(() => {
    const isValid = Boolean(state.document.url || state.document.templateId);
    dispatch({
      type: 'VALIDATE_STEP',
      payload: { step: 'step1Valid', isValid }
    });
  }, [state.document.url, state.document.templateId, dispatch]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string, templateUrl: string) => {
    setSelectedTemplateId(templateId);
    
    dispatch({
      type: 'SET_DOCUMENT',
      payload: {
        templateId,
        url: templateUrl,
        title: templates.find(t => t.id === templateId)?.name || '',
      }
    });
  };

  // Handle document upload completion
  const handleUploadComplete = (fileData: { url: string; name: string; file_type: string; size?: number }) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: {
        url: fileData.url,
        title: fileData.name,
      }
    });

    toast({
      title: 'Document Uploaded',
      description: 'Your document has been uploaded successfully.',
    });
  };

  // Handle document title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: { title: e.target.value }
    });
  };

  // Handle save as template checkbox change
  const handleSaveAsTemplateChange = (checked: boolean) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: { saveAsTemplate: checked }
    });
  };

  // Handle template name change
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: { templateName: e.target.value }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Document Selection</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Choose an existing template or upload a new document to send for signing.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="upload">Upload New Document</TabsTrigger>
          <TabsTrigger value="template">Use Template</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Label htmlFor="document-title">Document Title</Label>
                <Input 
                  id="document-title" 
                  className="mt-1" 
                  placeholder="Enter document title"
                  value={state.document.title}
                  onChange={handleTitleChange}
                />
              </div>
              
              <div className="mt-4">
                <FileUpload 
                  onUploadComplete={handleUploadComplete} 
                  onError={(message) => {
                    toast({
                      title: 'Upload Error',
                      description: message,
                      variant: 'destructive',
                    });
                  }}
                />
              </div>
              
              {state.document.url && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="save-template" 
                      checked={state.document.saveAsTemplate}
                      onCheckedChange={handleSaveAsTemplateChange}
                    />
                    <Label htmlFor="save-template">Save as template for future use</Label>
                  </div>
                  
                  {state.document.saveAsTemplate && (
                    <div className="pl-6">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input 
                        id="template-name" 
                        className="mt-1" 
                        placeholder="Enter template name"
                        value={state.document.templateName || state.document.title}
                        onChange={handleTemplateNameChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="template" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p>No templates found. Upload a document and save it as a template first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all ${
                    selectedTemplateId === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template.id, template.templateFilePath)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded px-2 py-1 uppercase font-medium">
                        {extractFileExtension(template.templateFilePath) || 'DOC'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}