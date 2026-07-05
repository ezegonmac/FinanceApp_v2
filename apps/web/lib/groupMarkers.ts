export type ContributionMarker = {
  id: number;
  type: "BUY" | "SELL";
  units: string;
  unit_price: string;
  total_amount: string;
  description: string | null;
  processed_at: string;
};

export type PricePoint = {
  timestamp: string;
  price: number;
};

export type SingleMarker = {
  kind: "single";
  marker: ContributionMarker;
  position: { x: string; y: number };
};

export type MarkerGroup = {
  kind: "group";
  markers: ContributionMarker[];
  position: { x: string; y: number };
  count: number;
  totalAmount: number;
  buyCount: number;
  sellCount: number;
};

export type MarkerOrGroup = SingleMarker | MarkerGroup;

/**
 * Binary search on sorted priceData to find the price of the closest
 * price point to the given timestamp.
 */
export function findNearestPrice(
  timestamp: string,
  priceData: PricePoint[],
): number {
  if (priceData.length === 0) return 0;

  const target = new Date(timestamp).getTime();

  let low = 0;
  let high = priceData.length - 1;

  // If target is before all prices, return first price
  if (target <= new Date(priceData[0]!.timestamp).getTime()) {
    return priceData[0]!.price;
  }

  // If target is after all prices, return last price
  if (target >= new Date(priceData[high]!.timestamp).getTime()) {
    return priceData[high]!.price;
  }

  // Binary search for the insertion point
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(priceData[mid]!.timestamp).getTime();

    if (midTime === target) {
      return priceData[mid]!.price;
    } else if (midTime < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // At this point, high < low and the insertion point is between high and low.
  // Compare distances to both neighbors.
  const distToHigh = Math.abs(
    target - new Date(priceData[high]!.timestamp).getTime(),
  );
  const distToLow = Math.abs(
    new Date(priceData[low]!.timestamp).getTime() - target,
  );

  return distToHigh <= distToLow
    ? priceData[high]!.price
    : priceData[low]!.price;
}

/**
 * Groups contribution markers based on pixel proximity on the chart.
 * Uses a greedy algorithm: markers sorted by x-position are merged into
 * groups when they fall within `threshold` pixels of the group anchor.
 */
export function groupMarkers(
  markers: ContributionMarker[],
  priceData: PricePoint[],
  chartWidth: number,
  threshold: number = 20,
): MarkerOrGroup[] {
  if (markers.length === 0 || priceData.length === 0 || chartWidth <= 0) {
    return [];
  }

  const minTime = new Date(priceData[0]!.timestamp).getTime();
  const maxTime = new Date(priceData[priceData.length - 1]!.timestamp).getTime();
  const timeRange = maxTime - minTime;

  // Compute pixel x-position for each marker
  const withPixel = markers.map((marker) => {
    const markerTime = new Date(marker.processed_at).getTime();
    const x = timeRange === 0 ? 0 : ((markerTime - minTime) / timeRange) * chartWidth;
    return { marker, x };
  });

  // Sort by pixel x-position ascending
  withPixel.sort((a, b) => a.x - b.x);

  // Greedy grouping
  const groups: { markers: ContributionMarker[]; anchorX: number; anchorTimestamp: string }[] = [];
  let currentGroup: { markers: ContributionMarker[]; anchorX: number; anchorTimestamp: string } | null = null;

  for (const item of withPixel) {
    if (currentGroup === null) {
      currentGroup = {
        markers: [item.marker],
        anchorX: item.x,
        anchorTimestamp: item.marker.processed_at,
      };
    } else if (Math.abs(item.x - currentGroup.anchorX) <= threshold) {
      currentGroup.markers.push(item.marker);
    } else {
      groups.push(currentGroup);
      currentGroup = {
        markers: [item.marker],
        anchorX: item.x,
        anchorTimestamp: item.marker.processed_at,
      };
    }
  }

  // Push the last group
  if (currentGroup !== null) {
    groups.push(currentGroup);
  }

  // Convert groups to MarkerOrGroup results
  const result: MarkerOrGroup[] = [];

  for (const group of groups) {
    const y = findNearestPrice(group.anchorTimestamp, priceData);

    if (group.markers.length === 1) {
      result.push({
        kind: "single",
        marker: group.markers[0]!,
        position: { x: group.markers[0]!.processed_at, y },
      });
    } else {
      const totalAmount = group.markers.reduce(
        (sum, m) => sum + parseFloat(m.total_amount),
        0,
      );
      const buyCount = group.markers.filter((m) => m.type === "BUY").length;
      const sellCount = group.markers.filter((m) => m.type === "SELL").length;

      result.push({
        kind: "group",
        markers: group.markers,
        position: { x: group.anchorTimestamp, y },
        count: group.markers.length,
        totalAmount,
        buyCount,
        sellCount,
      });
    }
  }

  return result;
}
