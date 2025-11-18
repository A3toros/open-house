// Retest service wrappers for backend endpoints
// Uses tokenManager for authenticated requests

export const retestService = {
  async createRetestAssignment(payload) {
    const res = await window.tokenManager.makeAuthenticatedRequest(
      '/.netlify/functions/create-retest-assignment',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create retest');
    return data;
  },

  async getRetestEligibleStudents({ test_type, original_test_id, threshold }) {
    const qs = new URLSearchParams({ test_type, original_test_id: String(original_test_id) });
    if (threshold !== undefined) qs.set('threshold', String(threshold));
    const res = await window.tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-retest-eligible-students?${qs.toString()}`
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load eligible students');
    return data.students || [];
  },

  async getRetestAssignments(teacherId) {
    const qs = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : '';
    const res = await window.tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-retest-assignments${qs}`
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load retests');
    return data.retests || [];
  },

  async getRetestTargets(retestId) {
    const res = await window.tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-retest-targets?retest_id=${encodeURIComponent(retestId)}`
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load retest targets');
    return data.targets || [];
  },

  async cancelRetestAssignment(retestId) {
    const res = await window.tokenManager.makeAuthenticatedRequest(
      '/.netlify/functions/cancel-retest-assignment',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retest_id: retestId })
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to cancel retest');
    return data.updated === true;
  }
};


