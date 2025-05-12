'use client';
import { useEffect, useRef } from 'react';

const renderConfigurations = {};
let label = '';

function closestByClass(el, className) {
  return el && el.classList && el.classList.contains(className) ? el : el ? closestByClass(el.parentNode, className) : null;
}

function fileToDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function createCustomSignatureNode(name) {
  const div = document.createElement('div');
  div.innerHTML = `<div class="custom-signature-field">
    <img class="custom-signature-icon" src="/signature.svg" alt="signature-icon"/>
    <span class="custom-signature-name">${name}</span>
  </div>`;
  return div;
}

const getAnnotationRenderers = ({ annotation }) => {
  // Use cached render configuration
  if (renderConfigurations[annotation.id]) {
    return renderConfigurations[annotation.id];
  }

  renderConfigurations[annotation.id] = {
    node: createCustomSignatureNode(annotation.name),
    append: true,
  };

  return renderConfigurations[annotation.id] || null;
};

export default function PdfViewer() {
  const containerRef = useRef(null);
  let isDragAndDropSupported = false;
  const docUrl = 'https://www.nutrient.io/downloads/pspdfkit-web-demo.pdf';

  useEffect(() => {
    const container = containerRef.current;

    (async function () {
      if (window.NutrientViewer) {
        window.NutrientViewer.unload(container);
      }

      const toolbarItems = window.NutrientViewer.defaultToolbarItems.filter((item) => {
        return /\b("pager|pan|search|sidebar-document-outline|sidebar-document-outline|sidebar-thumbnails|zoom-in|zoom-mode|zoom-out|layout")\b/.test(
          item.type,
        );
      });

      window.NutrientViewer.load({
        container,
        document: docUrl,
        toolbarItems,
        enableHistory: true,
        electronicSignatures: {
          creationModes: [
            window.NutrientViewer.ElectronicSignatureCreationMode.DRAW,
            window.NutrientViewer.ElectronicSignatureCreationMode.IMAGE,
            window.NutrientViewer.ElectronicSignatureCreationMode.TYPE,
          ],
        },
        customRenderers: {
          Annotation: getAnnotationRenderers,
        },
        styleSheets: ['/styles/viewer.css'],
      }).then(async (instance) => {
        const signaturesString = localStorage.getItem(process.env.STORAGE_KEY);
        if (signaturesString) {
          const storedSignatures = JSON.parse(signaturesString);
          // Construct annotations from serialized entries and call setStoredSignatures API
          const list = window.NutrientViewer.Immutable.List(storedSignatures.map(window.NutrientViewer.Annotations.fromSerializableObject));
          instance.setStoredSignatures(list);

          const attachmentsString = localStorage.getItem(process.env.ATTACHMENTS_KEY);

          if (attachmentsString) {
            const attachmentsArray = JSON.parse(attachmentsString);
            // from the data URLs on local storage instantiate Blob objects
            const blobs = await Promise.all(attachmentsArray.map(({ url }) => fetch(url).then((res) => res.blob())));

            // create an attachment for each blob
            blobs.forEach(instance.createAttachment);
          }
        }

        instance.addEventListener('storedSignatures.create', async (annotation) => {
          const signaturesString = localStorage.getItem(process.env.STORAGE_KEY);
          const storedSignatures = signaturesString ? JSON.parse(signaturesString) : [];

          const serializedAnnotation = window.NutrientViewer.Annotations.toSerializableObject(annotation);

          if (annotation.imageAttachmentId) {
            const attachment = await instance.getAttachment(annotation.imageAttachmentId);

            // Create data URL and add it to local storage.
            // Note: This is done only for demonstration purpose.
            // Storing potential large chunks of data using local storage is
            // considered bad practice due to the synchronous nature of that API.
            // For production applications, please consider alternatives such a
            // dedicated back-end storage or IndexedDB.
            const url = await fileToDataURL(attachment);
            const attachmentsString = localStorage.getItem(process.env.ATTACHMENTS_KEY);
            const attachmentsArray = attachmentsString ? JSON.parse(attachmentsString) : [];

            attachmentsArray.push({ url, id: annotation.imageAttachmentId });
            localStorage.setItem(process.env.ATTACHMENTS_KEY, JSON.stringify(attachmentsArray));
          }

          storedSignatures.push(serializedAnnotation);
          localStorage.setItem(process.env.STORAGE_KEY, JSON.stringify(storedSignatures));
          // Add new annotation so that its render as part of the UI on the current session
          instance.setStoredSignatures((signatures) => signatures.push(annotation));
        });

        instance.addEventListener('storedSignatures.delete', (annotation) => {
          const signaturesString = localStorage.getItem(process.env.STORAGE_KEY);
          const storedSignatures = signaturesString ? JSON.parse(signaturesString) : [];
          const annotations = storedSignatures.map(PSPDFKit.Annotations.fromSerializableObject);
          const updatedAnnotations = annotations.filter((currentAnnotation) => !currentAnnotation.equals(annotation));

          localStorage.setItem(process.env.STORAGE_KEY, JSON.stringify(updatedAnnotations.map(PSPDFKit.Annotations.toSerializableObject)));
          // Use setStoredSignatures API so that the current UI is properly updated
          instance.setStoredSignatures((signatures) => signatures.filter((signature) => !signature.equals(annotation)));

          if (annotation.imageAttachmentId) {
            // Remove attachment from array
            const attachmentsString = localStorage.getItem(process.env.ATTACHMENTS_KEY);

            if (attachmentsString) {
              let attachmentsArray = JSON.parse(attachmentsString);

              attachmentsArray = attachmentsArray.filter((attachment) => attachment.id !== annotation.imageAttachmentId);
              localStorage.setItem(process.env.ATTACHMENTS_KEY, JSON.stringify(attachmentsArray));
            }
          }
        });

        instance.contentDocument.ondragover = function (event) {
          debugger;
          isDragAndDropSupported = true;

          const pageElement = closestByClass(event.target, 'PSPDFKit-Page');

          if (pageElement) {
            // Allow drop operation
            event.preventDefault();
          }
        };

        // drag and drop listener on the document
        instance.contentDocument.ondrop = async function (event) {
          debugger;

          event.preventDefault();
          event.stopPropagation();

          label = event.dataTransfer.getData('text');

          const pageElement = closestByClass(event.target, 'PSPDFKit-Page');

          if (pageElement) {
            const pageIndex = parseInt(pageElement.dataset.pageIndex);

            const clientRect = new window.NutrientViewer.Geometry.Rect({
              left: event.clientX,
              top: event.clientY,
              height: 55,
              width: 220,
            });

            const pageRect = instance.transformContentClientToPageSpace(clientRect, pageIndex);

            const widget = new window.NutrientViewer.Annotations.WidgetAnnotation({
              boundingBox: pageRect,
              formFieldName: label, // change this to something unique if you want to have multiple signature fields per user
              id: window.NutrientViewer.generateInstantId(),
              pageIndex,
              name: label,
            });

            const formField = new window.NutrientViewer.FormFields.SignatureFormField({
              annotationIds: new window.NutrientViewer.Immutable.List([widget.id]),
              name: label,
            });

            // set the viewer to form creator mode so that the user can place the field
            instance.setViewState((viewState) => viewState.set('interactionMode', window.NutrientViewer.InteractionMode.FORM_CREATOR));

            await instance.create([widget, formField]);
          }

          return false;
        };
      });
    })();

    return () => window.NutrientViewer && window.NutrientViewer.unload(container);
  }, [docUrl]);

  return <div ref={containerRef} className='h-screen' style={{ height: '100vh' }} />;
}
