"use client";

import { useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";
import type { IriPlaybookStatus } from "../../lib/rhIdeia/types";

export type RhScope = {
  ready: boolean;
  seesAll: boolean;
  isLeader: boolean;
};

export function useRhScope(): RhScope {
  const [scope, setScope] = useState<RhScope>({ ready: false, seesAll: false, isLeader: false });

  useEffect(() => {
    iriFetch<IriPlaybookStatus>("/playbook/status").then((res) => {
      setScope({
        ready: true,
        seesAll: Boolean(res.data?.sees_all),
        isLeader: Boolean(res.data?.is_leader),
      });
    });
  }, []);

  return scope;
}
