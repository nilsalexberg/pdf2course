export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export const useBreadcrumbs = () => {
  const breadcrumbs = useState<BreadcrumbItem[]>('breadcrumbs', () => []);

  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbs.value = items;
  };

  return {
    breadcrumbs,
    setBreadcrumbs
  };
};
