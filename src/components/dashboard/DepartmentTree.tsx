import type { DeptTreeNode } from "@/services/departments.service";

interface Props {
  tree: DeptTreeNode[];
}

export function DepartmentTree({ tree }: Props) {
  if (tree.length === 0) {
    return <p className="text-sm text-gray-500">尚無部門資料</p>;
  }

  return (
    <ul className="space-y-1">
      {tree.map((node) => (
        <TreeNode key={node.dept_id} node={node} depth={0} />
      ))}
    </ul>
  );
}

function TreeNode({ node, depth }: { node: DeptTreeNode; depth: number }) {
  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
      >
        <span className="h-2 w-2 rounded-full bg-primary-500" />
        <span>{node.dept_name}</span>
        {node.children.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">
            {node.children.length} 子部門
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="border-l border-white/5 ml-5">
          {node.children.map((child) => (
            <TreeNode key={child.dept_id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
