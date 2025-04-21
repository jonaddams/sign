'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { extractFileExtension, getFileTypeIcon } from '@/lib/file-utils';
import { Calendar, CheckCircle2, FileText, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useDocumentFlow } from '../../context/DocumentFlowContext';

interface Template {
  id: string;
  name: string;
  createdAt: string;
  templateFilePath: string;
  description?: string;
  size?: number;
}

export default function DocumentSelection() {
  const { state, dispatch } = useDocumentFlow();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = isMobile ? 4 : 6;

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('Failed to fetch templates');

        const data = await response.json();
        // Make sure we capture the size information from the API response
        const templatesWithSize = (data.templates || []).map((template: any) => ({
          ...template,
          size: template.size || template.file_size || undefined,
        }));

        setTemplates(templatesWithSize);
        setFilteredTemplates(templatesWithSize);
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

  // Filter templates when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter(
        (template) => template.name.toLowerCase().includes(query) || (template.description && template.description.toLowerCase().includes(query)),
      );
      setFilteredTemplates(filtered);
    }

    // Reset pagination to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, templates]);

  // Validate step when document is selected or uploaded
  useEffect(() => {
    const isValid = Boolean(state.document.url || state.document.templateId);
    dispatch({
      type: 'VALIDATE_STEP',
      payload: { step: 'step1Valid', isValid },
    });
  }, [state.document.url, state.document.templateId, dispatch]);

  // Get current templates for the current page
  const indexOfLastTemplate = currentPage * templatesPerPage;
  const indexOfFirstTemplate = indexOfLastTemplate - templatesPerPage;
  const currentTemplates = filteredTemplates.slice(indexOfFirstTemplate, indexOfLastTemplate);

  // Calculate total pages
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);

  // Generate page numbers for pagination
  const pageNumbers: (number | 'ellipsis')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (isMobile) {
      // Simpler pagination for mobile
      pageNumbers.push(1);
      if (currentPage !== 1 && currentPage !== totalPages) {
        pageNumbers.push(currentPage);
      }
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage <= 3) {
        pageNumbers.push(2, 3, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push('ellipsis', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push('ellipsis', currentPage, 'ellipsis', totalPages);
      }
    }
  }

  // Handle template selection
  const handleSelectTemplate = (templateId: string, templateUrl: string) => {
    // If the template is already selected, unselect it
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);

      // Clear the template from the document state
      dispatch({
        type: 'SET_DOCUMENT',
        payload: {
          templateId: undefined,
          url: undefined,
          title: '',
        },
      });
    } else {
      // Otherwise, select the new template
      setSelectedTemplateId(templateId);

      dispatch({
        type: 'SET_DOCUMENT',
        payload: {
          templateId,
          url: templateUrl,
          title: templates.find((t) => t.id === templateId)?.name || '',
        },
      });
    }
  };

  // Handle document upload completion
  const handleUploadComplete = (fileData: { url: string; name: string; file_type: string; size?: number }) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: {
        url: fileData.url,
        title: fileData.name,
        fileSize: fileData.size || 0, // Store file size in the document state
      },
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
      payload: { title: e.target.value },
    });
  };

  // Handle save as template checkbox change
  const handleSaveAsTemplateChange = (checked: boolean) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: { saveAsTemplate: checked },
    });
  };

  // Handle template name change
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_DOCUMENT',
      payload: { templateName: e.target.value },
    });
  };

  // Render mobile template card
  const renderMobileTemplateCard = (template: Template) => {
    const isSelected = selectedTemplateId === template.id;
    const fileExt = extractFileExtension(template.templateFilePath) || 'DOC';
    const fileType = fileExt.toUpperCase();
    const displayType =
      fileExt === 'pdf'
        ? 'PDF Document'
        : fileExt === 'doc' || fileExt === 'docx'
          ? 'Word Document'
          : fileExt === 'xls' || fileExt === 'xlsx'
            ? 'Excel Spreadsheet'
            : fileExt === 'ppt' || fileExt === 'pptx'
              ? 'PowerPoint'
              : fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png' || fileExt === 'tiff' || fileExt === 'tif'
                ? 'Image'
                : 'Document';
    const iconData = getFileTypeIcon(displayType);

    return (
      <Card
        key={template.id}
        className={`mb-3 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
        onClick={() => handleSelectTemplate(template.id, template.templateFilePath)}
      >
        <CardContent className='py-3 px-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-md bg-blue-100 p-2 dark:bg-blue-900'>
                {iconData.image ? (
                  <Image src={iconData.image} alt={displayType} width={16} height={16} className={iconData.className} />
                ) : iconData.icon ? (
                  <iconData.icon className={iconData.className} />
                ) : (
                  <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                )}
              </div>
              <div>
                <div className={`line-clamp-1 font-medium ${isMobile ? 'text-sm' : ''}`}>{template.name}</div>
                <div className='text-muted-foreground mt-1 flex items-center text-xs'>
                  <Calendar className='mr-1 h-3 w-3' />
                  {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {isSelected && <CheckCircle2 className='h-5 w-5 text-blue-500' />}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold tracking-tight'>Document Selection</h2>
        <p className='text-muted-foreground mt-2 text-sm'>Choose an existing template or upload a new document to send for signing.</p>
      </div>

      <Tabs defaultValue='upload' className='w-full'>
        <TabsList className={isMobile ? 'flex h-auto w-full flex-col space-y-2 py-2' : 'mb-4 grid grid-cols-2'}>
          <TabsTrigger
            value='upload'
            className={`${isMobile ? 'mb-2 w-full' : ''} cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400`}
          >
            Upload New Document
          </TabsTrigger>
          <TabsTrigger
            value='template'
            className={`${isMobile ? 'w-full' : ''} cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-400`}
          >
            Use Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value='upload' className='mt-4 space-y-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mt-4'>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onError={(message) => {
                    toast({
                      title: 'Upload Error',
                      description: message,
                      variant: 'destructive',
                    });
                  }}
                  saveAsTemplate={state.document.saveAsTemplate}
                  onSaveAsTemplateChange={handleSaveAsTemplateChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='template' className='space-y-4'>
          <div className='relative'>
            <div className={`relative mb-4 ${isMobile ? 'mt-4' : ''}`}>
              <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
              <Input placeholder='Search templates...' className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {isLoading ? (
              <div className='py-8 text-center'>Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className='py-8 text-center'>
                <p>
                  {searchQuery.trim() !== '' ? 'No templates match your search.' : 'No templates found. Upload a document and save it as a template first.'}
                </p>
              </div>
            ) : (
              <>
                {isMobile ? (
                  <div className='space-y-2'>{currentTemplates.map((template) => renderMobileTemplateCard(template))}</div>
                ) : (
                  <Card className='border shadow-sm'>
                    <ScrollArea className='h-[360px]'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentTemplates.map((template) => (
                            <TableRow
                              key={template.id}
                              className={`cursor-pointer transition-all ${selectedTemplateId === template.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                              onClick={() => handleSelectTemplate(template.id, template.templateFilePath)}
                            >
                              <TableCell className='w-1/3'>
                                <div className='flex items-center'>
                                  <div className='flex-grow truncate mr-2'>
                                    <span className={`${selectedTemplateId === template.id ? 'font-medium' : ''} truncate`} title={template.name}>
                                      {template.name}
                                    </span>
                                  </div>
                                  <div className='w-5 flex-shrink-0'>
                                    {selectedTemplateId === template.id && <CheckCircle2 className='h-4 w-4 text-blue-500' />}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-2'>
                                  {(() => {
                                    const fileExt = extractFileExtension(template.templateFilePath) || 'DOC';
                                    const displayType =
                                      fileExt === 'pdf'
                                        ? 'PDF Document'
                                        : fileExt === 'doc' || fileExt === 'docx'
                                          ? 'Word Document'
                                          : fileExt === 'xls' || fileExt === 'xlsx'
                                            ? 'Excel Spreadsheet'
                                            : fileExt === 'ppt' || fileExt === 'pptx'
                                              ? 'PowerPoint'
                                              : fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png' || fileExt === 'tiff' || fileExt === 'tif'
                                                ? 'Image'
                                                : 'Document';
                                    const iconData = getFileTypeIcon(displayType);
                                    return iconData.image ? (
                                      <Image src={iconData.image} alt={displayType} width={16} height={16} className={iconData.className} />
                                    ) : iconData.icon ? (
                                      <iconData.icon className={iconData.className} />
                                    ) : null;
                                  })()}
                                  <span className='inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                                    {extractFileExtension(template.templateFilePath) || 'DOC'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {template.size
                                  ? template.size < 1024
                                    ? `${template.size} B`
                                    : template.size < 1024 * 1024
                                      ? `${(template.size / 1024).toFixed(1)} KB`
                                      : `${(template.size / (1024 * 1024)).toFixed(1)} MB`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                )}

                {totalPages > 1 && (
                  <div className='mt-4'>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>

                        {!isMobile
                          ? pageNumbers.map((page, index) =>
                              page === 'ellipsis' ? (
                                <PaginationItem key={`ellipsis-${index}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              ) : (
                                <PaginationItem key={page}>
                                  <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)} className='cursor-pointer'>
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ),
                            )
                          : // Simplified pagination for mobile
                            pageNumbers.map((page, index) => (
                              <PaginationItem key={`page-${index}`}>
                                {page === 'ellipsis' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)} className='cursor-pointer'>
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
