import ProfileSettingsToggleRow from '@/features/profile/settings/components/ProfileSettingsToggleRow'

type ProfilePrivacySectionProps = {
  showEmail: boolean
  showFollowers: boolean
  showFollowing: boolean
  showFavorites: boolean
  showLikedPosts: boolean
  onShowEmailChange: (checked: boolean) => void
  onShowFollowersChange: (checked: boolean) => void
  onShowFollowingChange: (checked: boolean) => void
  onShowFavoritesChange: (checked: boolean) => void
  onShowLikedPostsChange: (checked: boolean) => void
}

const ProfilePrivacySection = ({
  showEmail,
  showFollowers,
  showFollowing,
  showFavorites,
  showLikedPosts,
  onShowEmailChange,
  onShowFollowersChange,
  onShowFollowingChange,
  onShowFavoritesChange,
  onShowLikedPostsChange,
}: ProfilePrivacySectionProps) => (
  <div className="space-y-3">
    <ProfileSettingsToggleRow
      label="Show email on public profile"
      description="Useful for collaborators and publishers. Hidden by default."
      checked={showEmail}
      onChange={onShowEmailChange}
    />
    <ProfileSettingsToggleRow
      label="Show followers count"
      description="Let people see how many readers follow you."
      checked={showFollowers}
      onChange={onShowFollowersChange}
    />
    <ProfileSettingsToggleRow
      label="Show following count"
      description="Make your reading network visible."
      checked={showFollowing}
      onChange={onShowFollowingChange}
    />
    <ProfileSettingsToggleRow
      label="Show saved books"
      description="Display your favorite books and saved shelf publicly."
      checked={showFavorites}
      onChange={onShowFavoritesChange}
    />
    <ProfileSettingsToggleRow
      label="Show liked posts"
      description="Display blog posts you have liked."
      checked={showLikedPosts}
      onChange={onShowLikedPostsChange}
    />
  </div>
)

export default ProfilePrivacySection
