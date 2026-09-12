import { useNavigate } from 'react-router-dom'
import { QuestionnaireTab } from '../../components/caregiver/QuestionnaireTab'
import { Card } from '../../components/common/Card'

export default function Onboarding() {
  const navigate = useNavigate()

  const handleComplete = () => {
    navigate('/caregiver')
  }

  return (
    <div className="min-h-screen bg-cream text-ink py-8 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-fire text-white rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-md">
            🧠
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Welcome to SmritiSetu (স্মৃতি সেতু)</h1>
          <p className="text-sm text-ink/70 max-w-md mx-auto">
            Please complete this short baseline assessment to help calibrate games and activities for the patient.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-clay/40 p-6 shadow-sm">
          <QuestionnaireTab onComplete={handleComplete} />
        </div>
      </div>
    </div>
  )
}
