import { Check, Edit3 } from 'lucide-react';

export function DocumentPreview() {
  return (
    <div className='relative h-full w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl'>
      {/* Document Header */}
      <div className='absolute left-0 right-0 top-0 flex h-14 items-center justify-between border-gray-200 bg-blue-50 px-6'>
        <div className='flex items-center'>
          <div className='mr-2 h-3 w-3 rounded-full bg-red-500'></div>
          <div className='mr-2 h-3 w-3 rounded-full bg-yellow-500'></div>
          <div className='h-3 w-3 rounded-full bg-green-500'></div>
        </div>
        <div className='text-sm font-medium text-gray-500'>service_agreement.pdf</div>
        <div className='flex items-center'>
          <div className='rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>Completed</div>
        </div>
      </div>

      {/* Document Content */}
      <div className='px-8 pb-8 pt-16'>
        {/* Document Title */}
        <div className='mb-6 text-center'>
          <h3 className='text-xl font-bold text-gray-800'>SERVICE AGREEMENT</h3>
          <div className='mx-auto mt-2 h-1 w-16 bg-blue-500'></div>
        </div>

        {/* Document Text */}
        <div className='space-y-4'>
          {/* Paragraph lines */}
          <div className='h-2 w-full rounded bg-gray-200'></div>
          <div>
            <div className='mb-2 h-3 w-1/4 rounded bg-gray-300'></div>
            <div className='space-y-2'>
              <div className='h-2 w-full rounded bg-gray-200'></div>
              <div className='h-2 w-1/2 rounded bg-gray-200'></div>
            </div>
          </div>

          {/* Signature Section */}
          <div className='mt-6 border-t border-gray-200 pt-6'>
            <div className='grid grid-cols-2 gap-8'>
              {/* First Signature */}
              <div>
                {/* <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div> */}
                <div className='relative h-16 rounded-md border border-gray-300 bg-gray-50'>
                  <div className='absolute bottom-2 left-4 right-4'>
                    <div className='font-signature text-xl text-blue-600' style={{ fontFamily: 'cursive' }}>
                      John Doe
                    </div>
                    <div className='mt-1 h-px w-full bg-blue-400'></div>
                  </div>
                  <div className='absolute right-1 top-1 text-green-500'>
                    <Check size={16} />
                  </div>
                </div>
                <div className='mt-1 text-xs text-gray-500'>Signed on 03/11/2025</div>
              </div>

              {/* Second Signature */}
              <div>
                {/* <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div> */}
                <div className='relative h-16 rounded-md border border-gray-300 bg-gray-50'>
                  <div className='absolute bottom-2 left-4 right-4'>
                    <div className='font-signature text-xl text-blue-600' style={{ fontFamily: 'Brush Script MT, cursive' }}>
                      Jane Smith
                    </div>
                    <div className='mt-1 h-px w-full bg-blue-400'></div>
                  </div>
                  <div className='absolute right-1 top-1 text-green-500'>
                    <Check size={16} />
                  </div>
                </div>
                <div className='mt-1 text-xs text-gray-500'>Signed on 03/13/2025</div>
              </div>
            </div>
          </div>

          {/* Initials Section */}
          <div className='mt-6 flex justify-between'>
            {/* Left Initials */}
            <div className='flex items-center'>
              <div className='mr-2 flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-gray-50'>
                <div className='font-signature text-sm text-blue-600' style={{ fontFamily: 'cursive' }}>
                  JD
                </div>
              </div>
              <div className='text-xs text-gray-500'>Page 1 of 3</div>
            </div>

            {/* Right Initials */}
            <div className='flex items-center'>
              <div className='text-xs text-gray-500'>Page 1 of 3</div>
              <div className='ml-2 flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-gray-50'>
                <div className='font-signature text-sm text-blue-600' style={{ fontFamily: 'Brush Script MT, cursive' }}>
                  JS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Footer with Watermark */}
      <div className='absolute bottom-4 left-0 right-0 flex justify-center'>
        <div className='flex items-center text-xs text-gray-400'>
          <Edit3 size={12} className='mr-1' />
          Securely signed with Sign
        </div>
      </div>
    </div>
  );
}
