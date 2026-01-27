// This file provides context for the field placement functionality
// with support for recipient navigation and field assignment

import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSession } from '@/contexts/session-context';
import type { Recipient } from './DocumentFlowContext';

interface FormPlacementContextType {
  formPlacementMode: boolean;
  setFormPlacementMode: React.Dispatch<React.SetStateAction<boolean>>;
  currentRecipient: Recipient | null;
  currentRecipientIndex: number;
  setCurrentRecipientIndex: React.Dispatch<React.SetStateAction<number>>;
  signerRecipients: Recipient[];
  goToNextRecipient: () => void;
  goToPreviousRecipient: () => void;
  recipientColors: { [email: string]: string };

  // New field tracking properties
  recipientFieldCounts: {
    [email: string]: {
      signature: number;
      initials: number;
      date: number;
    };
  };
  updateFieldCount: (recipientEmail: string, fieldType: string, increment: boolean) => void;

  // New validation properties
  allSignersHaveSignatures: boolean;
  signersWithoutSignatures: string[]; // Emails of signers who still need signatures
  recipientHasSignature: (email: string) => boolean;
}

// Create the context with default values
export const FormPlacementContext = createContext<FormPlacementContextType>({
  formPlacementMode: false,
  setFormPlacementMode: () => {},
  currentRecipient: null,
  currentRecipientIndex: 0,
  setCurrentRecipientIndex: () => {},
  signerRecipients: [],
  goToNextRecipient: () => {},
  goToPreviousRecipient: () => {},
  recipientColors: {},
  recipientFieldCounts: {},
  updateFieldCount: () => {},
  allSignersHaveSignatures: false,
  signersWithoutSignatures: [],
  recipientHasSignature: () => false,
});

// A hook to use the form placement context
export const useFormPlacement = () => useContext(FormPlacementContext);

// Provider component that wraps parts of the app that need the context
export const FormPlacementProvider: React.FC<{
  children: React.ReactNode;
  recipients: Recipient[];
  userWillSign?: boolean;
  userDisplayName?: string;
  userEmail?: string;
}> = ({ children, recipients, userWillSign = false, userDisplayName, userEmail }) => {
  const { session } = useSession();
  const [formPlacementMode, setFormPlacementMode] = useState(false);
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState(0);

  // New state for tracking field counts per recipient
  const [recipientFieldCounts, setRecipientFieldCounts] = useState<{
    [email: string]: { signature: number; initials: number; date: number };
  }>({});

  // Determine current user info - prefer passed props, fallback to session
  const currentUserEmail = userEmail || session?.user?.email;
  const currentUserName = userDisplayName || session?.user?.name || 'Me (Current User)';

  // Create a placeholder email if needed (for "I am the only signer" scenarios without session)
  // This ensures the signer list is populated even when session isn't available
  const effectiveEmail =
    currentUserEmail ||
    (userWillSign && currentUserName
      ? `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@placeholder.local`
      : undefined);

  // Filter signer recipients and add current user if they will sign
  const signerRecipients = useMemo(
    () => [
      ...(userWillSign && (effectiveEmail || currentUserName)
        ? [
            {
              email: effectiveEmail || 'current.user@placeholder.local',
              name: currentUserName,
              role: 'signer',
            } as Recipient,
          ]
        : []),
      ...recipients.filter((r) => r.role === 'signer'),
    ],
    [userWillSign, effectiveEmail, currentUserName, recipients],
  );

  console.log('[FormPlacementContext] Computed signers:', {
    userWillSign,
    hasSession: !!session,
    sessionUser: session?.user,
    recipientsCount: recipients.length,
    signerRecipientsCount: signerRecipients.length,
    signerRecipients,
  });

  // Get current recipient
  const currentRecipient = signerRecipients.length > 0 ? signerRecipients[currentRecipientIndex] : null;

  // Generate a unique color for each recipient
  const recipientColors = signerRecipients.reduce(
    (acc, recipient, index) => {
      const hue = (index * 137.5) % 360; // Generate evenly spaced hues
      acc[recipient.email] = `hsl(${hue}, 70%, 85%)`; // Solid colors for better visibility
      return acc;
    },
    {} as { [email: string]: string },
  );

  // Navigation functions
  const goToNextRecipient = () => {
    if (currentRecipientIndex < signerRecipients.length - 1) {
      setCurrentRecipientIndex(currentRecipientIndex + 1);
    }
  };

  const goToPreviousRecipient = () => {
    if (currentRecipientIndex > 0) {
      setCurrentRecipientIndex(currentRecipientIndex - 1);
    }
  };

  // Update field counts for a recipient
  const updateFieldCount = useCallback((email: string, fieldType: string, increment: boolean) => {
    setRecipientFieldCounts((prev) => {
      // Get current counts or initialize with zeros
      const currentCounts = prev[email] || { signature: 0, initials: 0, date: 0 };

      // Make sure we never go below zero
      const newCount = Math.max(0, currentCounts[fieldType as keyof typeof currentCounts] + (increment ? 1 : -1));

      return {
        ...prev,
        [email]: {
          ...currentCounts,
          [fieldType]: newCount,
        },
      };
    });
  }, []);

  // Computed validation properties
  const allSignersHaveSignatures = useMemo(() => {
    return signerRecipients.every((recipient) => (recipientFieldCounts[recipient.email]?.signature || 0) > 0);
  }, [signerRecipients, recipientFieldCounts]);

  const signersWithoutSignatures = useMemo(() => {
    return signerRecipients
      .filter((recipient) => (recipientFieldCounts[recipient.email]?.signature || 0) === 0)
      .map((recipient) => recipient.email);
  }, [signerRecipients, recipientFieldCounts]);

  // Helper function to check if a recipient has a signature
  const recipientHasSignature = useCallback(
    (email: string) => {
      return (recipientFieldCounts[email]?.signature || 0) > 0;
    },
    [recipientFieldCounts],
  );

  // Value object passed to consumers
  const value = {
    formPlacementMode,
    setFormPlacementMode,
    currentRecipient,
    currentRecipientIndex,
    setCurrentRecipientIndex,
    signerRecipients,
    goToNextRecipient,
    goToPreviousRecipient,
    recipientColors,
    recipientFieldCounts,
    updateFieldCount,
    allSignersHaveSignatures,
    signersWithoutSignatures,
    recipientHasSignature,
  };

  return <FormPlacementContext.Provider value={value}>{children}</FormPlacementContext.Provider>;
};
