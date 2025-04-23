'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-between pt-1 relative items-center px-1 pb-3',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center space-x-1',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-zinc-800',
          'disabled:pointer-events-none disabled:opacity-50',
        ),
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex justify-between w-full',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          'inline-flex items-center justify-center rounded-md transition-colors bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 h-9 w-9 p-0 font-normal aria-selected:opacity-100',
          'disabled:pointer-events-none disabled:opacity-50',
        ),
        day_range_end: 'day-range-end',
        day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        // Enhanced wrapper styles to fix spacing issues
        root: 'w-full max-w-full [&>div[data-radix-popper-content-wrapper]]:!w-full [&>div[data-radix-popper-content-wrapper]]:!max-w-full [&>div[data-radix-popper-content-wrapper]]:!overflow-visible [&>div[data-radix-popper-content-wrapper]]:!transform-none md:[&>div[data-radix-popper-content-wrapper]]:!overflow-visible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
