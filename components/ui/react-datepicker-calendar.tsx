'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type * as React from 'react';
import DatePicker from 'react-datepicker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Import the react-datepicker CSS
import 'react-datepicker/dist/react-datepicker.css';

interface ReactDatePickerCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | null) => void;
  className?: string;
  mode?: 'single' | 'range';
  initialFocus?: boolean;
  disabled?: (date: Date) => boolean;
}

function ReactDatePickerCalendar({
  selected,
  onSelect,
  className,
  mode = 'single',
  disabled,
  ...props
}: ReactDatePickerCalendarProps) {
  const handleDateChange = (date: Date | null) => {
    if (onSelect) {
      onSelect(date);
    }
  };

  // Custom styling to match your theme
  const customStyles = {
    datePickerContainer: cn('react-datepicker-wrapper', 'w-full', className),
    datePicker: cn('react-datepicker', 'border border-input bg-background rounded-md shadow-md'),
    datePickerHeader: 'react-datepicker__header bg-background border-b border-input',
    dayName: 'react-datepicker__day-name text-muted-foreground text-xs',
    day: 'react-datepicker__day hover:bg-accent hover:text-accent-foreground rounded-md',
    daySelected: 'react-datepicker__day--selected bg-primary text-primary-foreground',
    dayToday: 'react-datepicker__day--today border border-primary',
    monthContainer: 'react-datepicker__month-container p-2',
  };

  return (
    <div className={customStyles.datePickerContainer}>
      <DatePicker
        selected={selected}
        onChange={handleDateChange}
        inline
        calendarClassName={customStyles.datePicker}
        dayClassName={() => customStyles.day}
        wrapperClassName="w-full"
        calendarStartDay={1} // Start week on Monday
        showPopperArrow={false}
        disabledKeyboardNavigation={!props.initialFocus}
        filterDate={disabled}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-2 py-2">
            <button
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              type="button"
              className={cn(
                'inline-flex items-center justify-center rounded-md border border-input p-1',
                'hover:bg-accent hover:text-accent-foreground',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium">{format(date, 'MMMM yyyy')}</div>
            <button
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              type="button"
              className={cn(
                'inline-flex items-center justify-center rounded-md border border-input p-1',
                'hover:bg-accent hover:text-accent-foreground',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}

ReactDatePickerCalendar.displayName = 'ReactDatePickerCalendar';

function ChevronLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// Wrapper component that includes the popover
export function ReactDatePickerWrapper({
  selected,
  onSelect,
  className,
  disabled,
  ...props
}: ReactDatePickerCalendarProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !selected && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : <span>Select date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ReactDatePickerCalendar
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
          initialFocus={props.initialFocus}
        />
      </PopoverContent>
    </Popover>
  );
}

export { ReactDatePickerCalendar };
