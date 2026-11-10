(function (root) {
  "use strict";
  const skills = ["Ins", "Jps", "Fts", "3ps", "Hnd", "Pas", "Orb", "Drb", "Psd", "Prd", "Stl", "Blk", "Qkn", "Jmp", "Str", "Sta"];
  const number = value => value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const seasonNumber = season => Number(String(season).match(/\d+/)?.[0] || 0);
  const file = player => String(player.url || player.playerId || "").match(/player\d+/i)?.[0].toLowerCase() + ".htm";
  const name = player => String(player.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const identity = (player, keys) => keys ? keys[file(player)] : String(player.url || player.playerId || player.name).toLowerCase();

  function configs(index) {
    const seasons = (index.seasons || []).slice().sort((a, b) => seasonNumber(a.season) - seasonNumber(b.season));
    const latest = seasonNumber(seasons.at(-1)?.season);
    const result = [{ id: "current", label: latest ? `S${latest}–S${latest + 1} · Current` : "Current TC", order: latest + 1,
      current: "../../../00-build/database/players.json", previous: "../../../00-build/database/PreTC/players.json", historical: false }];
    for (let i = 1; i < seasons.length; i++) {
      const previous = seasons[i - 1], current = seasons[i];
      if (seasonNumber(current.season) !== seasonNumber(previous.season) + 1) continue;
      const base = `../../../00-build/history/${current.season}/database/`;
      const prior = `../../../00-build/history/${previous.season}/database/`;
      result.push({ id: current.season, label: `S${seasonNumber(previous.season)}–S${seasonNumber(current.season)}`, order: seasonNumber(current.season), historical: true,
        current: base + "players.json", previous: prior + "players.json", currentKeys: base + "player_history_keys.json", previousKeys: prior + "player_history_keys.json" });
    }
    return result;
  }

  function compare(current, previous, config, currentKeys, previousKeys) {
    if (config.historical && (!currentKeys || !previousKeys)) throw new Error("Historical identity maps are missing.");
    const priorById = new Map(previous.map(player => [identity(player, previousKeys), player]).filter(([id]) => id));
    const groups = new Map();
    for (const player of current) {
      if (!/^roster\d+$/i.test(player.team || "") || /mascot/i.test(player.name || "")) continue;
      const key = identity(player, currentKeys);
      const prior = key && priorById.get(key);
      // Include threshold crossings in either direction, and unchanged eligible players.
      if (Math.max(number(player.overall) ?? 0, number(prior?.overall) ?? 0) < 50) continue;
      if (!groups.has(player.team)) groups.set(player.team, { team: player.team, label: player.teamLabel || player.team, camp: config, players: [], excluded: 0 });
      const group = groups.get(player.team);
      if (!prior || (!currentKeys && name(player) !== name(prior)) ||
        skills.concat(["overall", "potential"]).some(key => number(player[key]) === null || number(prior[key]) === null)) {
        group.excluded++;
        continue;
      }
      const net = skills.reduce((sum, key) => sum + number(player[key]) - number(prior[key]), 0);
      const potential = number(player.potential) - number(prior.potential);
      group.players.push({ player, prior, key, net, overall: number(player.overall) - number(prior.overall), potential,
        potImpact: potential * number(prior.potential) / 100, ovrImpact: potential * number(prior.overall) / 100 });
    }
    return [...groups.values()].filter(group => group.players.length).map(group => {
      const sum = key => group.players.reduce((total, player) => total + player[key], 0);
      return { ...group, count: group.players.length, net: sum("net"), average: sum("net") / group.players.length,
        overall: sum("overall") / group.players.length, potential: sum("potential") / group.players.length,
        potDelta: sum("potential"),
        improved: group.players.filter(player => player.potential > 0).length / group.players.length * 100,
        potImpact: sum("potImpact"), ovrImpact: sum("ovrImpact") };
    });
  }

  function franchises(rows) {
    const groups = new Map();
    rows.forEach(row => {
      if (!groups.has(row.team)) groups.set(row.team, []);
      groups.get(row.team).push(row);
    });
    return [...groups.values()].map(camps => {
      const average = key => camps.reduce((sum, row) => sum + row[key], 0) / camps.length;
      return { team: camps[0].team, label: camps[0].label, camps: camps.length, members: camps,
        totalPotImpact: camps.reduce((sum, row) => sum + row.potImpact, 0), totalOvrImpact: camps.reduce((sum, row) => sum + row.ovrImpact, 0),
        potDelta: average("potDelta"), totalPotDelta: camps.reduce((sum, row) => sum + row.potDelta, 0),
        count: average("count"), excluded: camps.reduce((sum, row) => sum + row.excluded, 0),
        potImpact: average("potImpact"), ovrImpact: average("ovrImpact"), net: average("net"), average: average("average"), overall: average("overall"), potential: average("potential"), improved: average("improved") };
    });
  }
  const api = { skills, configs, compare, franchises };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TrainingCampHistory = api;
}(typeof window !== "undefined" ? window : globalThis));
