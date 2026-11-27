import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SessionStatus() {
  const { sessionError, retrySession, logout } = useAuth();
  return <div className="session-loading" role={sessionError ? 'alert' : 'status'} aria-live="polite">
    {sessionError ? <AlertCircle size={28} /> : <RefreshCw size={28} className="animate-spin" />}
    <h1>{sessionError ? 'Unable to open your panel' : 'Opening your HeyLane panel...'}</h1>
    {sessionError && <>
      <p>{sessionError}</p>
      <div className="session-actions">
        <button className="btn btn-primary" onClick={retrySession}>Try again</button>
        <button className="btn btn-outline" onClick={logout}>Back to sign in</button>
      </div>
    </>}
  </div>;
}
