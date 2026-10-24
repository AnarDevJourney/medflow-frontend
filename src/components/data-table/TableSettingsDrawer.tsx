import {
  CheckCircleFilled,
  ColumnHeightOutlined,
  HolderOutlined,
  PushpinOutlined,
  UndoOutlined,
  VerticalAlignMiddleOutlined,
} from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Checkbox, Drawer, Popconfirm, Segmented, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import type { ResolvedColumn } from "./resolveColumns";
import type { TABLE_VIEWS } from "./tableViews";
import { TableViewPreview } from "./TableViewPreview";
import type { ColumnPin, TableDensity, TableViewId } from "./types";
import styles from "./TableSettingsDrawer.module.css";

interface TableSettingsDrawerProps<T> {
  open: boolean;
  onClose: () => void;
  columns: ResolvedColumn<T>[];
  density: TableDensity;
  view: TableViewId;
  views: typeof TABLE_VIEWS; // the views this table supports
  customized: boolean; // something differs from the defaults
  onColumnsChange: (columns: ResolvedColumn<T>[]) => void;
  onDensityChange: (density: TableDensity) => void;
  onViewChange: (view: TableViewId) => void;
  onReset: () => void;
}

type Zone = "left" | "none" | "right";
const zoneOf = (pinned: ColumnPin | null): Zone => pinned ?? "none";

// Everything about how one table looks: preset view (with live previews),
// row density, and the columns (show / hide, order, pin, width reset).
export function TableSettingsDrawer<T>({
  open,
  onClose,
  columns,
  density,
  view,
  views,
  customized,
  onColumnsChange,
  onDensityChange,
  onViewChange,
  onReset,
}: TableSettingsDrawerProps<T>) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleCount = columns.filter((c) => c.visible).length;
  const change = (key: string, patch: Partial<ResolvedColumn<T>>) =>
    onColumnsChange(columns.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  // Pinning moves the column to the end of the left zone / start of the right zone
  const pin = (key: string, pinned: ColumnPin | null) => {
    const column = columns.find((c) => c.key === key)!;
    const rest = columns.filter((c) => c.key !== key);
    const updated = { ...column, pinned };
    const at =
      pinned === "left"
        ? rest.filter((c) => c.pinned === "left").length
        : pinned === "right"
          ? rest.findIndex((c) => c.pinned === "right")
          : rest.filter((c) => c.pinned !== "right").length;
    const index = at < 0 ? rest.length : at;
    onColumnsChange([...rest.slice(0, index), updated, ...rest.slice(index)]);
  };

  // Reordering stays inside a zone (left-pinned / unpinned / right-pinned)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = columns.findIndex((c) => c.key === active.id);
    const to = columns.findIndex((c) => c.key === over.id);
    if (zoneOf(columns[from].pinned) !== zoneOf(columns[to].pinned)) return;
    onColumnsChange(arrayMove(columns, from, to));
  };

  const zones: { zone: Zone; label: string }[] = [
    { zone: "left", label: t("table.pinnedLeft") },
    { zone: "none", label: t("table.notPinned") },
    { zone: "right", label: t("table.pinnedRight") },
  ];

  return (
    <Drawer
      title={t("table.settings")}
      open={open}
      onClose={onClose}
      size={440}
      footer={
        <div className={styles.footer}>
          <Popconfirm
            title={t("table.resetConfirmTitle")}
            description={t("table.resetConfirmBody")}
            okText={t("table.reset")}
            cancelText={t("common.cancel")}
            onConfirm={onReset}
            disabled={!customized}
          >
            <Button icon={<UndoOutlined />} disabled={!customized}>
              {t("table.reset")}
            </Button>
          </Popconfirm>
          <Button type="primary" onClick={onClose}>
            {t("table.done")}
          </Button>
        </div>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.heading}>{t("table.view")}</h3>
        <div className={styles.views} role="radiogroup" aria-label={t("table.view")}>
          {views.map((option) => {
            const selected = option.id === view;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.viewCard, selected && styles.viewSelected]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onViewChange(option.id)}
              >
                {selected && <CheckCircleFilled className={styles.viewCheck} />}
                <TableViewPreview view={option.id} density={density} columns={columns} />
                <span className={styles.viewName}>{t(option.nameKey)}</span>
                <span className={styles.viewDesc}>{t(option.descKey)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{t("table.density")}</h3>
        <Segmented<TableDensity>
          block
          value={density}
          onChange={onDensityChange}
          options={[
            {
              value: "compact",
              label: t("table.compact"),
              icon: <VerticalAlignMiddleOutlined />,
            },
            {
              value: "comfortable",
              label: t("table.comfortable"),
              icon: <ColumnHeightOutlined />,
            },
          ]}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h3 className={styles.heading}>{t("table.columns")}</h3>
          <span className={styles.count}>
            {t("table.visibleCount", { visible: visibleCount, total: columns.length })}
          </span>
        </div>
        <p className={styles.hint}>{t("table.columnsHint")}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          {zones.map(({ zone, label }) => {
            const items = columns.filter((c) => zoneOf(c.pinned) === zone);
            if (items.length === 0 && zone !== "none") return null;
            return (
              <div key={zone} className={styles.zone}>
                <div className={styles.zoneLabel}>{label}</div>
                <SortableContext
                  items={items.map((c) => c.key)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.list}>
                    {items.map((column) => (
                      <ColumnRow
                        key={column.key}
                        column={column}
                        // the last visible column can't be hidden
                        lockVisible={
                          column.def.hideable === false ||
                          (column.visible && visibleCount === 1)
                        }
                        onVisibleChange={(visible) => change(column.key, { visible })}
                        onPinChange={(pinned) => pin(column.key, pinned)}
                        onResetWidth={() =>
                          change(column.key, {
                            customWidth: false,
                            width: column.def.width ?? 160,
                          })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </DndContext>
        <Button
          type="link"
          size="small"
          className={styles.showAll}
          disabled={visibleCount === columns.length}
          onClick={() => onColumnsChange(columns.map((c) => ({ ...c, visible: true })))}
        >
          {t("table.showAll")}
        </Button>
      </section>
    </Drawer>
  );
}

interface ColumnRowProps<T> {
  column: ResolvedColumn<T>;
  lockVisible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onPinChange: (pinned: ColumnPin | null) => void;
  onResetWidth: () => void;
}

function ColumnRow<T>({
  column,
  lockVisible,
  onVisibleChange,
  onPinChange,
  onResetWidth,
}: ColumnRowProps<T>) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        styles.columnRow,
        isDragging && styles.dragging,
        !column.visible && styles.hidden,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={styles.handle}
        aria-label={t("table.dragColumn", { name: column.def.title })}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </button>
      <Tooltip title={lockVisible ? t("table.alwaysVisible") : undefined}>
        <Checkbox
          checked={column.visible}
          disabled={lockVisible}
          onChange={(event) => onVisibleChange(event.target.checked)}
          className={styles.columnName}
        >
          {column.def.title}
        </Checkbox>
      </Tooltip>
      {column.customWidth && (
        <Tooltip title={t("table.resetWidth")}>
          <button type="button" className={styles.width} onClick={onResetWidth}>
            {column.width} px
          </button>
        </Tooltip>
      )}
      <Segmented<Zone>
        size="small"
        value={zoneOf(column.pinned)}
        onChange={(zone) => onPinChange(zone === "none" ? null : zone)}
        options={[
          {
            value: "left",
            icon: <PushpinOutlined rotate={-45} />,
            title: t("table.pinLeft"),
          },
          { value: "none", label: "—", title: t("table.unpin") },
          {
            value: "right",
            icon: <PushpinOutlined rotate={45} />,
            title: t("table.pinRight"),
          },
        ]}
      />
    </div>
  );
}
