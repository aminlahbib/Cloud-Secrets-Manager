import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FormSection } from '../../ui/FormSection';

interface TeamAdvancedSectionProps {
  canDeleteTeam: boolean;
  onEditTeam: () => void;
  onDeleteTeam: () => void;
}

export const TeamAdvancedSection: React.FC<TeamAdvancedSectionProps> = ({
  canDeleteTeam,
  onEditTeam,
  onDeleteTeam,
}) => {
  return (
    <FormSection
      variant="card"
      title="Team Management"
      description="Edit team details or permanently delete the team. This action cannot be undone."
      className="rounded-3xl"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" onClick={onEditTeam}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Team
        </Button>
        {canDeleteTeam && (
          <Button variant="danger" onClick={onDeleteTeam}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Team
          </Button>
        )}
      </div>
    </FormSection>
  );
};

