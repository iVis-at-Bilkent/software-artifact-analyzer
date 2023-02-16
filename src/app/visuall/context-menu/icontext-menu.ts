
export interface ContextMenuItem {
  id: string;
  content: string;
  selector?: string;
  submenu?: any;
  onClickFunction?: (event: any) => void;
  // must be false for custom items
  coreAsWell?: boolean;
}