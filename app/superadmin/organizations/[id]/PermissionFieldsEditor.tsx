"use client";

import {
  ESTABLISHMENT_PERMISSION_GROUPS,
  type EstablishmentPermissionFlags,
} from "@/app/config/establishmentPermissionCatalog";

export default function PermissionFieldsEditor({
  value,
  onChange,
}: {
  value: EstablishmentPermissionFlags;
  onChange: (next: EstablishmentPermissionFlags) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {ESTABLISHMENT_PERMISSION_GROUPS.map((group) => (
        <div
          key={group.id}
          className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
        >
          <p className="mb-1 text-sm font-medium text-slate-200">{group.title}</p>
          {group.description && (
            <p className="mb-2 text-xs text-slate-500">{group.description}</p>
          )}
          <div className="space-y-2">
            {group.fields.map((field) => (
              <label
                key={field.key}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!value[field.key]}
                  onChange={(e) =>
                    onChange({ ...value, [field.key]: e.target.checked })
                  }
                />
                <span>
                  {field.label}
                  {field.hint && (
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {field.hint}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
