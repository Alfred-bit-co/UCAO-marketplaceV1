import {
  ArrowLeft as PhosphorArrowLeft,
  ArrowRight as PhosphorArrowRight,
  ArrowUpRight as PhosphorArrowUpRight,
  ArrowUp as PhosphorArrowUp,
  ArrowSquareOut as PhosphorArrowSquareOut,
  ArrowsClockwise as PhosphorArrowsClockwise,
  Basket as PhosphorBasket,
  BookOpen as PhosphorBookOpen,
  Calendar as PhosphorCalendar,
  CaretLeft as PhosphorCaretLeft,
  CaretRight as PhosphorCaretRight,
  ChartBar as PhosphorChartBar,
  ChatCircle as PhosphorChatCircle,
  Check as PhosphorCheck,
  CheckCircle as PhosphorCheckCircle,
  CircleNotch as PhosphorCircleNotch,
  Clock as PhosphorClock,
  ComputerTower as PhosphorComputerTower,
  Crown as PhosphorCrown,
  Diamond as PhosphorDiamond,
  Envelope as PhosphorEnvelope,
  Eye as PhosphorEye,
  EyeSlash as PhosphorEyeSlash,
  FileText as PhosphorFileText,
  FileX as PhosphorFileX,
  FloppyDisk as PhosphorFloppyDisk,
  Globe as PhosphorGlobe,
  GraduationCap as PhosphorGraduationCap,
  HandCoins as PhosphorHandCoins,
  Handshake as PhosphorHandshake,
  Handbag as PhosphorHandbag,
  Headset as PhosphorHeadset,
  IdentificationCard as PhosphorIdentificationCard,
  Image as PhosphorImage,
  InstagramLogo as PhosphorInstagramLogo,
  Key as PhosphorKey,
  List as PhosphorList,
  Lock as PhosphorLock,
  MagnifyingGlass as PhosphorMagnifyingGlass,
  MapPin as PhosphorMapPin,
  Medal as PhosphorMedal,
  Minus as PhosphorMinus,
  Moon as PhosphorMoon,
  Package as PhosphorPackage,
  PaperPlaneTilt as PhosphorPaperPlaneTilt,
  Phone as PhosphorPhone,
  PencilSimple as PhosphorPencilSimple,
  Plus as PhosphorPlus,
  PlusCircle as PhosphorPlusCircle,
  Printer as PhosphorPrinter,
  Question as PhosphorQuestion,
  Quotes as PhosphorQuotes,
  Shield as PhosphorShield,
  SealCheck as PhosphorSealCheck,
  ShieldCheck as PhosphorShieldCheck,
  ShieldWarning as PhosphorShieldWarning,
  ShoppingCart as PhosphorShoppingCart,
  SignIn as PhosphorSignIn,
  SignOut as PhosphorSignOut,
  Spinner as PhosphorSpinner,
  SquaresFour as PhosphorSquaresFour,
  Star as PhosphorStar,
  Storefront as PhosphorStorefront,
  Sun as PhosphorSun,
  TShirt as PhosphorTShirt,
  Trash as PhosphorTrash,
  UserCheck as PhosphorUserCheck,
  UploadSimple as PhosphorUploadSimple,
  User as PhosphorUser,
  UserCircle as PhosphorUserCircle,
  UserCirclePlus as PhosphorUserCirclePlus,
  UserPlus as PhosphorUserPlus,
  Users as PhosphorUsers,
  UsersThree as PhosphorUsersThree,
  Wrench as PhosphorWrench,
  Warning as PhosphorWarning,
  X as PhosphorX,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import { createElement, forwardRef } from "react";

/**
 * A small compatibility layer keeps existing icon props working while every
 * rendered icon comes from Phosphor. Existing strokeWidth values are mapped
 * to Phosphor's supported `weight` variants.
 */
export type IconProps = PhosphorIconProps & { strokeWidth?: number };
export type IconComponent = React.ComponentType<IconProps>;

function adapt(icon: PhosphorIcon): IconComponent {
  return forwardRef<SVGSVGElement, IconProps>(function PhosphorCompatIcon(
    { strokeWidth, weight, ...props },
    ref,
  ) {
    const phosphorWeight = weight ?? (strokeWidth && strokeWidth <= 1.5 ? "light" : strokeWidth && strokeWidth >= 2.8 ? "bold" : "regular");
    return createElement(icon, { ...props, ref, weight: phosphorWeight });
  });
}

export const ArrowLeft = adapt(PhosphorArrowLeft);
export const ArrowRight = adapt(PhosphorArrowRight);
export const ArrowUpRight = adapt(PhosphorArrowUpRight);
export const ArrowUp = adapt(PhosphorArrowUp);
export const ArrowsClockwise = adapt(PhosphorArrowsClockwise);
export const AlertTriangle = adapt(PhosphorWarning);
export const BadgeCheck = adapt(PhosphorSealCheck);
export const BookOpen = adapt(PhosphorBookOpen);
export const CalendarDays = adapt(PhosphorCalendar);
export const Check = adapt(PhosphorCheck);
export const CheckCircle2 = adapt(PhosphorCheckCircle);
export const ChevronLeft = adapt(PhosphorCaretLeft);
export const ChevronRight = adapt(PhosphorCaretRight);
export const CirclePlus = adapt(PhosphorPlusCircle);
export const Cpu = adapt(PhosphorComputerTower);
export const Crown = adapt(PhosphorCrown);
export const BarChart3 = adapt(PhosphorChartBar);
export const Clock3 = adapt(PhosphorClock);
export const Eye = adapt(PhosphorEye);
export const EyeOff = adapt(PhosphorEyeSlash);
export const ExternalLink = adapt(PhosphorArrowSquareOut);
export const FileText = adapt(PhosphorFileText);
export const Gem = adapt(PhosphorDiamond);
export const Globe2 = adapt(PhosphorGlobe);
export const GraduationCap = adapt(PhosphorGraduationCap);
export const HandCoins = adapt(PhosphorHandCoins);
export const Handshake = adapt(PhosphorHandshake);
export const Headset = adapt(PhosphorHeadset);
export const HelpCircle = adapt(PhosphorQuestion);
export const IdCard = adapt(PhosphorIdentificationCard);
export const ImagePlus = adapt(PhosphorImage);
export const Instagram = adapt(PhosphorInstagramLogo);
export const KeyRound = adapt(PhosphorKey);
export const LayoutDashboard = adapt(PhosphorSquaresFour);
export const Lock = adapt(PhosphorLock);
export const Loader2 = adapt(PhosphorSpinner);
export const LogIn = adapt(PhosphorSignIn);
export const LogOut = adapt(PhosphorSignOut);
export const Mail = adapt(PhosphorEnvelope);
export const MapPin = adapt(PhosphorMapPin);
export const Medal = adapt(PhosphorMedal);
export const Menu = adapt(PhosphorList);
export const MessageCircle = adapt(PhosphorChatCircle);
export const MessageSquareQuote = adapt(PhosphorQuotes);
export const Minus = adapt(PhosphorMinus);
export const Moon = adapt(PhosphorMoon);
export const Package = adapt(PhosphorPackage);
export const PackageOpen = adapt(PhosphorPackage);
export const PackagePlus = adapt(PhosphorPackage);
export const Phone = adapt(PhosphorPhone);
export const Pencil = adapt(PhosphorPencilSimple);
export const Plus = adapt(PhosphorPlus);
export const Printer = adapt(PhosphorPrinter);
export const Save = adapt(PhosphorFloppyDisk);
export const Search = adapt(PhosphorMagnifyingGlass);
export const SearchX = adapt(PhosphorFileX);
export const Send = adapt(PhosphorPaperPlaneTilt);
export const ShieldAlert = adapt(PhosphorShieldWarning);
export const Shield = adapt(PhosphorShield);
export const ShieldCheck = adapt(PhosphorShieldCheck);
export const Shirt = adapt(PhosphorTShirt);
export const ShoppingBag = adapt(PhosphorHandbag);
export const ShoppingBasket = adapt(PhosphorBasket);
export const ShoppingCart = adapt(PhosphorShoppingCart);
export const Star = adapt(PhosphorStar);
export const Store = adapt(PhosphorStorefront);
export const Sun = adapt(PhosphorSun);
export const Trash2 = adapt(PhosphorTrash);
export const RefreshCcw = adapt(PhosphorArrowsClockwise);
export const Upload = adapt(PhosphorUploadSimple);
export const User = adapt(PhosphorUser);
export const UserPlus = adapt(PhosphorUserPlus);
export const UserCheck = adapt(PhosphorUserCheck);
export const UserRound = adapt(PhosphorUserCircle);
export const Users = adapt(PhosphorUsers);
export const UsersRound = adapt(PhosphorUsersThree);
export const Wrench = adapt(PhosphorWrench);
export const X = adapt(PhosphorX);
export const CircleLoader = adapt(PhosphorCircleNotch);
export const UserCirclePlus = adapt(PhosphorUserCirclePlus);
