'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import original calendar for comparison
import { Calendar } from '@/components/ui/calendar';

// Import the react-datepicker components
import { ReactDatePicker, ReactDatePickerCustom } from '@/components/ui/react-datepicker';
import { ReactDatePickerCalendar, ReactDatePickerWrapper } from '@/components/ui/react-datepicker-calendar';

export default function TestDatePickerPage() {
  const [date1, setDate1] = useState<Date | undefined>(new Date());
  const [date2, setDate2] = useState<Date | undefined>(new Date());
  const [date3, setDate3] = useState<Date | undefined>(new Date());
  const [date4, setDate4] = useState<Date | undefined>(new Date());

  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-3xl font-bold mb-8'>Date Picker Component Test Page</h1>

      <Tabs defaultValue='original'>
        <TabsList className='mb-6'>
          <TabsTrigger value='original'>Original Calendar</TabsTrigger>
          <TabsTrigger value='react-datepicker'>React DatePicker</TabsTrigger>
          <TabsTrigger value='react-datepicker-calendar'>React DatePicker Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value='original' className='space-y-8'>
          <h2 className='text-2xl font-bold'>Original Calendar Implementation</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Original Standalone Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Standalone Calendar</CardTitle>
                <CardDescription>Testing the original calendar component directly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full border rounded-md p-4'>
                  <Calendar mode='single' selected={date1} onSelect={setDate1} className='mx-auto' />
                </div>
                <div className='mt-4'>
                  <p>Selected date: {date1 ? format(date1, 'PPP') : 'None'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Original Date Picker with Popover */}
            <Card>
              <CardHeader>
                <CardTitle>Date Picker with Popover</CardTitle>
                <CardDescription>Testing the original complete date picker</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full p-4'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant='outline' className='w-full justify-start text-left font-normal'>
                        {date1 ? format(date1, 'PPP') : <span>Select date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar mode='single' selected={date1} onSelect={setDate1} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <div className='mt-4'>
                    <p>Selected date: {date1 ? format(date1, 'PPP') : 'None'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='react-datepicker' className='space-y-8'>
          <h2 className='text-2xl font-bold'>React DatePicker Implementation</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Simple React DatePicker */}
            <Card>
              <CardHeader>
                <CardTitle>Simple React DatePicker</CardTitle>
                <CardDescription>Basic implementation of react-datepicker</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full p-4'>
                  <ReactDatePicker date={date2} setDate={setDate2} id='simple-datepicker' />
                </div>
                <div className='mt-4'>
                  <p>Selected date: {date2 ? format(date2, 'PPP') : 'None'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Custom React DatePicker */}
            <Card>
              <CardHeader>
                <CardTitle>Custom React DatePicker</CardTitle>
                <CardDescription>Custom styled implementation with popover</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full p-4'>
                  <ReactDatePickerCustom date={date3} setDate={setDate3} id='custom-datepicker' placeholder='Select a date' />
                </div>
                <div className='mt-4'>
                  <p>Selected date: {date3 ? format(date3, 'PPP') : 'None'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='react-datepicker-calendar' className='space-y-8'>
          <h2 className='text-2xl font-bold'>React DatePicker Calendar Implementation</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Standalone Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Standalone Calendar</CardTitle>
                <CardDescription>Testing the ReactDatePickerCalendar component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full border rounded-md p-4'>
                  <ReactDatePickerCalendar selected={date4 || undefined} onSelect={(date) => setDate4(date || undefined)} className='mx-auto' />
                </div>
                <div className='mt-4'>
                  <p>Selected date: {date4 ? format(date4, 'PPP') : 'None'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Calendar with Wrapper */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar with Wrapper</CardTitle>
                <CardDescription>Testing the ReactDatePickerWrapper component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='w-full p-4'>
                  <ReactDatePickerWrapper selected={date4 || undefined} onSelect={(date) => setDate4(date || undefined)} initialFocus={true} />
                </div>
                <div className='mt-4'>
                  <p>Selected date: {date4 ? format(date4, 'PPP') : 'None'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
