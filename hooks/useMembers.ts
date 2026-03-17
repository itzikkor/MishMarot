import { useState, useEffect } from 'react';
import { subscribeMembers } from '../services/memberService';
import { Member } from '../types';

export function useMembers(orgId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const unsub = subscribeMembers(orgId, m => {
      setMembers(m);
      setIsLoading(false);
    });
    return unsub;
  }, [orgId]);

  return { members, isLoading };
}
