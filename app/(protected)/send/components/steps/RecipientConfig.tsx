'use client';

import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocumentFlow } from '../../context/DocumentFlowContext';

export default function RecipientConfig() {
  const { state, dispatch } = useDocumentFlow();
  const [validateAttempt, setValidateAttempt] = useState(false);
  const [isOnlySigner, setIsOnlySigner] = useState(false);
  const isMobile = useIsMobile();
  const nameInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const emailInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { data: session } = useSession();

  // Initialize user display name with session name on mount
  useEffect(() => {
    if (session?.user?.name && !state.userDisplayName) {
      dispatch({
        type: 'SET_USER_DISPLAY_NAME',
        payload: session.user.name,
      });
    }
  }, [session?.user?.name, state.userDisplayName, dispatch]);

  // Email validation helper
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate required recipient fields - wrapped in useCallback to prevent infinite loops
  const validateRecipients = useCallback(() => {
    // If user will sign, make sure they have provided their name
    if (state.userWillSign && (!state.userDisplayName || !state.userDisplayName.trim())) {
      return false;
    }

    // If user is the only signer, step is valid
    if (state.userWillSign && state.recipients.length === 0 && isOnlySigner) {
      return true;
    }

    // If user will sign (but not as the only signer) and there are no recipients, step is invalid
    if (state.userWillSign && state.recipients.length === 0 && !isOnlySigner) {
      return false;
    }

    // If there are no recipients and user isn't signing, step is invalid
    if (state.recipients.length === 0 && !state.userWillSign) {
      return false;
    }

    // For cases where we have recipients
    // Check that all recipients have required fields filled
    const allRecipientsValid = state.recipients.every((recipient) => {
      // Basic validation for name and email
      const hasValidName = recipient.name.trim() !== '';
      const hasValidEmail = recipient.email.trim() !== '' && isValidEmail(recipient.email);

      // Deadline is no longer required for individual recipients
      return hasValidName && hasValidEmail;
    });

    return allRecipientsValid;
  }, [state.userWillSign, state.userDisplayName, state.recipients, isOnlySigner, isValidEmail]);

  // Validate the recipients whenever dependencies change
  useEffect(() => {
    const isValid = validateRecipients();
    dispatch({
      type: 'VALIDATE_STEP',
      payload: { step: 'step2Valid', isValid },
    });
  }, [validateRecipients, dispatch]);

  // Check if the DocumentFlow component is attempting to navigate to the next step
  useEffect(() => {
    const handleBeforeNextStep = () => {
      if (state.currentStep === 2 && !validateRecipients()) {
        setValidateAttempt(true);
      }
    };

    window.addEventListener('beforeDocumentFlowNext', handleBeforeNextStep);
    return () => {
      window.removeEventListener('beforeDocumentFlowNext', handleBeforeNextStep);
    };
  }, [state.currentStep, validateRecipients]);

  // Add a new recipient
  const addRecipient = () => {
    const newId = uuidv4();
    const newRecipientOrder =
      state.recipients.length > 0 ? Math.max(...state.recipients.map((r) => r.signingOrder)) + 1 : 1;

    dispatch({
      type: 'ADD_RECIPIENT',
      payload: {
        id: newId,
        name: '',
        email: '',
        role: 'signer',
        signingOrder: newRecipientOrder,
      },
    });

    // Focus the name input after a short delay to allow rendering
    setTimeout(() => {
      const nameInput = nameInputRefs.current[newId];
      if (nameInput) {
        nameInput.focus();
      }
    }, 0);
  };

  // Remove a recipient
  const removeRecipient = (id: string) => {
    dispatch({
      type: 'REMOVE_RECIPIENT',
      payload: { id },
    });

    // Update signing order for remaining recipients if using sequential signing
    if (state.signingOrder === 'sequential') {
      updateSigningOrder();
    }
  };

  // Update recipient information
  const updateRecipient = (id: string, field: string, value: any) => {
    dispatch({
      type: 'UPDATE_RECIPIENT',
      payload: {
        id,
        data: { [field]: value },
      },
    });
  };

  // Toggle whether the user will sign the document
  const toggleUserWillSign = (checked: boolean) => {
    dispatch({
      type: 'SET_USER_WILL_SIGN',
      payload: checked,
    });

    // If user unchecks "I will also sign" and there are no recipients,
    // make sure step is invalid
    if (!checked) {
      setIsOnlySigner(false);

      if (state.recipients.length === 0) {
        dispatch({
          type: 'VALIDATE_STEP',
          payload: { step: 'step2Valid', isValid: false },
        });
      }
    }
  };

  // Toggle "I am the only signer" option
  const toggleOnlySigner = (checked: boolean) => {
    setIsOnlySigner(checked);

    if (checked) {
      // Remove all recipients if user is the only signer
      state.recipients.forEach((recipient) => {
        removeRecipient(recipient.id);
      });

      // Validate the step as true since user will be the only signer and has a name
      dispatch({
        type: 'VALIDATE_STEP',
        payload: { step: 'step2Valid', isValid: !!state.userDisplayName?.trim() },
      });
    } else {
      // When unchecking "I am the only signer", the step should be invalid until a recipient is added
      dispatch({
        type: 'VALIDATE_STEP',
        payload: { step: 'step2Valid', isValid: false },
      });

      // User can now add recipients again
      setValidateAttempt(false);
    }
  };

  // Set the signing order (sequential or parallel)
  const setSigningOrder = (value: 'sequential' | 'parallel') => {
    dispatch({
      type: 'SET_SIGNING_ORDER',
      payload: value,
    });

    // If switching to sequential, update the signing order
    if (value === 'sequential') {
      updateSigningOrder();
    }
  };

  // Update the signing order for all recipients
  const updateSigningOrder = () => {
    // Sort current recipients by their signing order
    const sortedRecipients = [...state.recipients].sort((a, b) => a.signingOrder - b.signingOrder);

    // Reassign order numbers sequentially
    sortedRecipients.forEach((recipient, index) => {
      dispatch({
        type: 'UPDATE_RECIPIENT',
        payload: {
          id: recipient.id,
          data: { signingOrder: index + 1 },
        },
      });
    });
  };

  // Update user's display name
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_USER_DISPLAY_NAME',
      payload: e.target.value,
    });
  };

  return (
    <div className="space-y-6 sm:p-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Add Recipients</h2>
        <p className="text-sm text-muted-foreground mt-2">Add recipients to sign or review your document</p>
      </div>

      <Card>
        <CardContent className="pt-6 p-0">
          <div className="space-y-4">
            {/* User options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="user-will-sign" checked={state.userWillSign} onCheckedChange={toggleUserWillSign} className="cursor-pointer" />
                <Label htmlFor="user-will-sign" className="font-medium cursor-pointer">
                  I will also sign this document
                </Label>
              </div>

              {state.userWillSign && (
                <div className="pl-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-signer"
                      checked={state.recipients.length === 0 && state.userWillSign && isOnlySigner}
                      onCheckedChange={toggleOnlySigner}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="only-signer" className="cursor-pointer">I am the only signer</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-display-name">Your name (as it will appear on the document)</Label>
                    <Input
                      id="user-display-name"
                      type="text"
                      defaultValue={state.userDisplayName || undefined}
                      onChange={handleDisplayNameChange}
                      placeholder="Enter your name"
                      className={
                        validateAttempt && (!state.userDisplayName || !state.userDisplayName.trim())
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {validateAttempt && (!state.userDisplayName || !state.userDisplayName.trim()) && (
                      <p className="text-xs text-red-500 mt-1">Please enter your name</p>
                    )}
                  </div>
                </div>
              )}

              {/* Signing order selection - shown whenever there are multiple recipients or
                  when there's a single recipient and the user will also sign */}
              {state.recipients.length > 1 && (
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="signing-order" className="text-base font-medium">
                    Signing Order
                  </Label>
                  <RadioGroup
                    id="signing-order"
                    value={state.signingOrder}
                    onValueChange={(value) => setSigningOrder(value as 'sequential' | 'parallel')}
                    className="flex flex-col space-y-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sequential" id="sequential" />
                      <Label htmlFor="sequential">Sequential (one after another)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parallel" id="parallel" />
                      <Label htmlFor="parallel">Parallel (all at once)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Recipients list */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Recipients</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Add people who need to sign or receive this document.
                        <br />
                        <strong>Signer:</strong> Will sign the document
                        <br />
                        <strong>Viewer:</strong> Can only view the document
                        <br />
                        <strong>CC:</strong> Receives a copy of the document
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {state.recipients.map((recipient, index) => (
                <div key={recipient.id} className={`space-y-4 ${index > 0 ? 'border-t pt-4' : ''}`}>
                  <div className={`${isMobile ? 'grid grid-cols-1 gap-4' : 'flex items-center gap-3'}`}>
                    {state.signingOrder === 'sequential' && (
                      <div
                        className={`${isMobile ? 'flex justify-start items-center mb-2' : 'flex items-center justify-center flex-shrink-0'}`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {recipient.signingOrder}
                          </span>
                        </div>

                        {isMobile && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRecipient(recipient.id)}
                            className="h-9 w-9 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-5 w-5 text-red-500" />
                            <span className="sr-only">Remove recipient</span>
                          </Button>
                        )}
                      </div>
                    )}

                    {/* For parallel signing order on mobile, show the trash icon at the top */}
                    {isMobile && state.signingOrder !== 'sequential' && (
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-muted-foreground">Recipient {index + 1}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(recipient.id)}
                          className="h-9 w-9 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                          <span className="sr-only">Remove recipient</span>
                        </Button>
                      </div>
                    )}

                    <div className={`${isMobile ? '' : 'flex-1'}`}>
                      <Label htmlFor={`name-${recipient.id}`} className="sr-only">
                        Name
                      </Label>
                      <Input
                        id={`name-${recipient.id}`}
                        placeholder="Recipient name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                        className={validateAttempt && recipient.name.trim() === '' ? 'border-red-500' : ''}
                        ref={(el) => {
                          if (el) {
                            nameInputRefs.current[recipient.id] = el;
                          } else {
                            delete nameInputRefs.current[recipient.id];
                          }
                        }}
                      />
                      {validateAttempt && recipient.name.trim() === '' && (
                        <p className="text-xs text-red-500 mt-1">Name is required</p>
                      )}
                    </div>

                    <div className={`${isMobile ? 'mt-2' : 'flex-1'}`}>
                      <Label htmlFor={`email-${recipient.id}`} className="sr-only">
                        Email
                      </Label>
                      <Input
                        id={`email-${recipient.id}`}
                        placeholder="Email address"
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(recipient.id, 'email', e.target.value)}
                        className={
                          validateAttempt && (recipient.email.trim() === '' || !isValidEmail(recipient.email))
                            ? 'border-red-500'
                            : ''
                        }
                        ref={(el) => {
                          if (el) {
                            emailInputRefs.current[recipient.id] = el;
                          } else {
                            delete emailInputRefs.current[recipient.id];
                          }
                        }}
                      />
                      {validateAttempt && recipient.email.trim() === '' && (
                        <p className="text-xs text-red-500 mt-1">Email is required</p>
                      )}
                      {validateAttempt && recipient.email.trim() !== '' && !isValidEmail(recipient.email) && (
                        <p className="text-xs text-red-500 mt-1">Invalid email format</p>
                      )}
                    </div>

                    <div className={`${isMobile ? 'mt-2' : 'w-[150px]'}`}>
                      <Label htmlFor={`role-${recipient.id}`} className="sr-only">
                        Role
                      </Label>
                      <Select
                        value={recipient.role}
                        onValueChange={(value) => updateRecipient(recipient.id, 'role', value)}
                      >
                        <SelectTrigger id={`role-${recipient.id}`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="signer">Signer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="cc">CC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!isMobile && (
                      <div className="flex items-center justify-center flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(recipient.id)}
                          className="h-9 w-9 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                          <span className="sr-only">Remove recipient</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isMobile && state.recipients.length > 0 && (
                <div className="mt-6 mb-4 border-t border-gray-200 dark:border-gray-700"></div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
                onClick={addRecipient}
                disabled={state.userWillSign && state.recipients.length === 0 && isOnlySigner}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>

            {/* User display name input - shown only when user will sign */}
            {state.userWillSign && (
              <div className="border-t pt-4">
                <Label htmlFor="user-display-name" className="text-base font-medium">
                  Your Name
                </Label>
                <Input
                  id="user-display-name"
                  placeholder="Enter your name"
                  value={state.userDisplayName}
                  onChange={(e) => dispatch({ type: 'SET_USER_DISPLAY_NAME', payload: e.target.value })}
                  className={
                    validateAttempt && (!state.userDisplayName || state.userDisplayName.trim() === '')
                      ? 'border-red-500'
                      : ''
                  }
                />
                {validateAttempt && (!state.userDisplayName || state.userDisplayName.trim() === '') && (
                  <p className="text-xs text-red-500 mt-1">Name is required</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {validateAttempt && !validateRecipients() && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="text-sm text-red-700 dark:text-red-200">
              Please ensure all recipient information is filled correctly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
