import SearchBar from './components/search-bar/SearchBar';
import { PageScaffold } from './components/page-scaffold';
import { Modal } from './components/modal';
import { Sidebar } from './components/sidebar';
import { SiteNav } from './components/site-nav';
import { Tabs } from './components/tabs';
import { ToastProvider } from './components/toast';
import { Topbar } from './components/topbar';
import { Pagination, RatingInput, Skeleton } from './opale-extras';
import {
  Button,
  Pressable,
  Input,
  Checkbox,
  Toggle,
  Slider,
  Select,
  MultiSelect,
  Autocomplete,
  InlineInput,
  SegmentedControl,
  Form,
  IconActionButton,
} from './catalog/forms';
import {
  Card,
  CardGrid,
  Badge,
  Heading,
  Text,
  Icon,
  DescriptionList,
  BulletList,
  Rating,
  StatCard,
  Donut,
  DataTable,
  LegalLinks,
} from './catalog/display';
import {
  Feedback,
  Toast,
  Spinner,
  ProgressBar,
  ConfirmDialog,
  EmptyState,
} from './catalog/feedback';
import {
  Navbar,
  Menu,
  Link,
  SidePanel,
  CommandPalette,
  Breadcrumb,
  CookieBanner,
  SelectionBar,
} from './catalog/navigation';
import { Stack, Layout, Divider, BackgroundSurface } from './catalog/layout';
import { FileCard, Dropzone, Lightbox, Clipboard } from './catalog/modules';
import { SvgMap, SvgMapControls } from './catalog/svg-map';

/* LE NAMESPACE `Opale` : chaque composant du paquet sous un seul nom. Les
   exports nommés (`import { Button } from '@thomascaron/opale-ui'`) restent la
   forme recommandée ; `Opale.Button` désigne le même composant. */
const COMPONENTS = {
  Button: Button,
  Pressable: Pressable,
  Card: Card,
  CardGrid: CardGrid,
  Input: Input,
  SearchBar: SearchBar,
  PageScaffold: PageScaffold,
  InlineInput: InlineInput,
  Checkbox: Checkbox,
  Toggle: Toggle,
  Slider: Slider,
  Select: Select,
  MultiSelect: MultiSelect,
  Autocomplete: Autocomplete,
  Form: Form,
  SegmentedControl: SegmentedControl,
  IconActionButton: IconActionButton,
  DataTable: DataTable,
  DescriptionList: DescriptionList,
  BulletList: BulletList,
  Badge: Badge,
  Rating: Rating,
  RatingInput: RatingInput,
  Pagination: Pagination,
  Skeleton: Skeleton,
  StatCard: StatCard,
  Donut: Donut,
  LegalLinks: LegalLinks,
  Heading: Heading,
  Text: Text,
  Icon: Icon,
  Feedback: Feedback,
  Toast: Toast,
  Spinner: Spinner,
  ProgressBar: ProgressBar,
  ConfirmDialog: ConfirmDialog,
  EmptyState: EmptyState,
  Navbar: Navbar,
  Menu: Menu,
  Link: Link,
  SidePanel: SidePanel,
  CommandPalette: CommandPalette,
  Breadcrumb: Breadcrumb,
  CookieBanner: CookieBanner,
  SelectionBar: SelectionBar,
  Stack: Stack,
  Layout: Layout,
  Divider: Divider,
  BackgroundSurface: BackgroundSurface,
  FileCard: FileCard,
  Dropzone: Dropzone,
  Lightbox: Lightbox,
  Clipboard: Clipboard,
  SvgMap: SvgMap,
  SvgMapControls: SvgMapControls,
  Modal: Modal,
  Tabs: Tabs,
  Sidebar: Sidebar,
  Topbar: Topbar,
  SiteNav: SiteNav,
  ToastProvider: ToastProvider,
} as const;

/** Tous les composants d'Opale sous un seul nom : `Opale.Button` est `Button`. */
export const Opale = {
  ...COMPONENTS,
  /** @deprecated Depuis 3.6 — utilisez `BackgroundSurface`. */
  Background: BackgroundSurface,
} as const;

/** @deprecated Depuis 3.6 — utilisez les exports nommés. */
export const OpaleUI = Opale;
