import Layout from '../components/common/Layout'
import AccountSettings from '../components/settings/AccountSettings'
import SecuritySettings from '../components/settings/SecuritySettings'
import PreferenceSettings from '../components/settings/PreferenceSettings'

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
        <div className="space-y-8">
          <AccountSettings />
          <SecuritySettings />
          <PreferenceSettings />
        </div>
      </div>
    </Layout>
  )
}
