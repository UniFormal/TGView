/**
 * JSON representing a TGView menu entry
 */
interface ITGViewMenuEntry {
    menuText: string;
    id: string;
    uri: string;
    type: string;
    hasChildren: boolean;
}