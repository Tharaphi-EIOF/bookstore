import ProfileSettingsToggleRow from '@/features/profile/settings/components/ProfileSettingsToggleRow'

type ProfileNotificationsSectionProps = {
  emailUpdatesEnabled: boolean
  followerAlertsEnabled: boolean
  marketingEmailsEnabled: boolean
  onEmailUpdatesChange: (checked: boolean) => void
  onFollowerAlertsChange: (checked: boolean) => void
  onMarketingEmailsChange: (checked: boolean) => void
}

const ProfileNotificationsSection = ({
  emailUpdatesEnabled,
  followerAlertsEnabled,
  marketingEmailsEnabled,
  onEmailUpdatesChange,
  onFollowerAlertsChange,
  onMarketingEmailsChange,
}: ProfileNotificationsSectionProps) => (
  <div className="grid gap-3 md:grid-cols-2">
    <ProfileSettingsToggleRow
      label="Email updates"
      description="Receive activity summaries and occasional reading highlights."
      checked={emailUpdatesEnabled}
      onChange={onEmailUpdatesChange}
    />
    <ProfileSettingsToggleRow
      label="Follower alerts"
      description="Receive alerts when someone follows you or your audience changes."
      checked={followerAlertsEnabled}
      onChange={onFollowerAlertsChange}
    />
    <ProfileSettingsToggleRow
      label="Product and marketing updates"
      description="Receive occasional launch notes, recommendations, and feature updates."
      checked={marketingEmailsEnabled}
      onChange={onMarketingEmailsChange}
    />
  </div>
)

export default ProfileNotificationsSection
