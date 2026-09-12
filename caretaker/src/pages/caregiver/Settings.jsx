import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { Card } from '../../components/common/Card'
import { useAuth } from '../../context/AuthContext'
import { getPatient, clearPatient } from '../../utils/patientStore'
import { User, Shield, Info, Key, Check } from 'lucide-react'
import { useState } from 'react'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const patient = getPatient()
  const [copied, setCopied] = useState(false)

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Patient ID: ${patient.id || 'p1'}, PIN: ${patient.pin || '4321'}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Account & Settings</h1>
          <p className="text-sm text-ink/60 mt-1">Manage caregiver, patient credentials and system preferences</p>
        </div>

        {/* Caregiver Profile */}
        <Card className="shadow-sm">
          <h3 className="font-bold text-ink mb-4 text-base flex items-center gap-2">
            <User className="w-5 h-5 text-fire" /> Your Profile (Caregiver)
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Name</span>
              <span className="text-ink font-semibold">{user?.name || 'Priya Devi'}</span>
            </div>
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Role</span>
              <span className="text-ink font-medium capitalize">{user?.role || 'caregiver'}</span>
            </div>
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Relationship</span>
              <span className="text-ink font-medium">{user?.relationship || 'Daughter'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Email</span>
              <span className="text-ink font-medium truncate ml-2">{user?.email || 'caregiver@example.com'}</span>
            </div>
          </div>
        </Card>

        {/* Patient Login Credentials Card */}
        <Card className="shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-sun" /> Patient Companion Login Credentials
            </h3>
            <button
              type="button"
              onClick={copyCredentials}
              className="text-xs px-2.5 py-1 bg-cream border border-clay/40 rounded-lg text-ink font-medium hover:bg-clay/20 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-tea-confirm" /> : null}
              <span>{copied ? 'Copied!' : 'Copy Info'}</span>
            </button>
          </div>
          <p className="text-xs text-ink/70 mb-3.5">
            Share these credentials with the elder or configure their companion tablet with this direct login PIN.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Patient ID / Username</span>
              <span className="text-ink font-mono font-bold">{patient.id || 'p1'}</span>
            </div>
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Tablet Passcode / PIN</span>
              <span className="text-fire font-mono font-bold tracking-widest">{patient.pin || '4321'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Assigned Patient</span>
              <span className="text-ink font-semibold">{patient.name}</span>
            </div>
          </div>
        </Card>

        {/* Patient Profile & Data Actions */}
        <Card className="shadow-sm">
          <h3 className="font-bold text-ink mb-4 text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-tea-confirm" /> Patient Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Name</span>
              <span className="text-ink font-semibold">{patient.name}</span>
            </div>
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Primary Language</span>
              <span className="text-ink font-medium">{patient.preferredLanguage}</span>
            </div>
            <div className="flex justify-between border-b border-clay/30 pb-2.5">
              <span className="text-ink/60">Age</span>
              <span className="text-ink font-medium">{patient.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Emergency Contact</span>
              <span className="text-ink font-medium truncate ml-2">{patient.emergencyContactName} ({patient.emergencyContact})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/caregiver/add-patient')}
            className="mt-5 w-full py-2.5 bg-fire text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer shadow-xs"
          >
            ✏️ Edit Patient Details
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset patient to demo data?')) {
                clearPatient()
                window.location.href = '/caregiver'
              }
            }}
            className="mt-2.5 w-full py-2.5 bg-clay/60 text-ink rounded-xl text-sm font-medium hover:bg-clay transition-colors cursor-pointer"
          >
            🔄 Reset to Demo Data
          </button>
        </Card>

        {/* About Card */}
        <Card className="shadow-sm">
          <h3 className="font-bold text-ink mb-3 text-base flex items-center gap-2">
            <Info className="w-5 h-5 text-tea-confirm" /> About SmritiSetu (স্মৃতি সেতু)
          </h3>
          <p className="text-xs text-ink/70 leading-relaxed">
            SmritiSetu is an AI-powered cognitive assistance and elder monitoring platform tailored for North Eastern India, supporting families, caregivers, and elders with dementia and memory loss.
          </p>
          <p className="text-xs text-ink/50 mt-3 font-medium">Version 1.0.0 (SIH-26003)</p>
        </Card>
      </div>
    </DashboardLayout>
  )
}