'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import chevronLeft from './icon-chevron-left.png';
import iconPlusGray from './icon-plus-gray.png';
import iconSignature from './icon-signature.png';
import PDFViewer from './pdf-viewer';
import './draganddrop.css';

export default function Page() {
  const _iNeedToSign = true;
  const signers = [
    { name: 'John Appleseed', uuid: '1' },
    { name: 'Joe Smith', uuid: '2' },
    { name: 'Jane Doe', uuid: '3' },
  ];

  const selectRef = useRef(null);

  const [_index, setIndex] = useState(0);

  function getSelectedUserName(uuid) {
    const selectedUser = signers.find((signee) => signee.uuid === uuid);
    return selectedUser.name;
  }

  function handleSelect(event) {
    if (signers.length > 1) {
      const i = signers.findIndex((signee) => signee.uuid === event.target.value);

      setIndex(i);
    }
  }

  function onDragStart(event) {
    event.target.style.opacity = '0.4';
    event.dataTransfer.setData('text/plain', getSelectedUserName(selectRef.current.value));
    event.dataTransfer.dropEffect = 'move';
  }

  function onDragEnd(event) {
    event.target.style.opacity = '1';
  }

  return (
    <div className="h-screen">
      <div className="container mx-auto p-3">
        <div className="flex">
          <div className="w-full lg:w-1/4">
            <div className="mb-5">
              <Link href="/document/">
                <Image alt="back" src={chevronLeft} width={16} className="inline-block mr-2" />
                <span className="font-bold text-smaller leading-4-half tracking-005">Home</span>
              </Link>
            </div>
            <div className="w-full border-b border-white bg-anti-flash-white flex justify-between content-center px-6 py-3">
              <select
                className="select bg-anti-flash-white select-ghost w-full"
                onChange={handleSelect}
                ref={selectRef}
              >
                {signers.map((signee, _index) => (
                  <option
                    value={signee.uuid}
                    key={signee.uuid}
                    className="text-base normal-case leading-55 tracking-02 text-dark-gunmetal"
                  >
                    {signee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="py-5 border-anti-flash-white px-5">
              <p className="text-smaller leading-4-half text-auto-metal-saurus tracking-005 mb-5">
                Drag to add signature to the document.
              </p>
              <div
                className="w-full border-0 bg-anti-flash-white rounded-full flex justify-between content-center py-5 px-6 mb-5 cursor-move"
                draggable={true}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              >
                <div>
                  <Image src={iconSignature} width={23} className="inline-block mr-5 mb-1" alt="plus icon" />
                  <span className="text-base normal-case leading-55 tracking-02 text-dark-gunmetal">Signature</span>
                </div>
                <div>
                  <Image src={iconPlusGray} width={18} className="inline-block" alt="plus icon" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <PDFViewer />
          </div>
        </div>
      </div>
    </div>
  );
}
